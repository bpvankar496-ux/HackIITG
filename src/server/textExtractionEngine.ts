/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getGeminiModel, getGeminiFallbackModel } from './geminiModels.ts';
import { GoogleGenAI, Type } from '@google/genai';
import {
  determineExtractionRoute,
  sanitizeExtractedText,
  computeWordCount,
  classifyPageStatus,
  calculateConfidenceScore,
} from '../utils/ocrPipeline.ts';
import {
  getDocumentById,
  updateDocumentStatus,
  downloadDocumentBuffer,
  saveDocumentPages,
  getDocumentPages,
} from './documentRepository.ts';
import type {
  DocumentPageInsertInput,
  DocumentPageRecord,
  ExtractionMethod,
} from '../types/database.types.ts';

// In-memory mutex to prevent concurrent duplicate processing of the same document
const activeProcessingJobs = new Set<string>();

/**
 * Initializes Google GenAI client using server-side environment credentials.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Attempts native PDF text-layer extraction page by page using PDFParse.
 */
async function extractPdfTextLayer(buffer: Buffer): Promise<{
  hasUsableText: boolean;
  pages: Array<{ pageNumber: number; text: string; isEmpty: boolean }>;
  totalChars: number;
  error?: string;
}> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    await (parser as any).load?.();
    const result = await parser.getText();
    
    const pagesRaw: Array<{ text: string; num: number }> = (result as any)?.pages || [];
    const numPages = Math.max(1, pagesRaw.length || (result as any)?.total || 1);
    const pages: Array<{ pageNumber: number; text: string; isEmpty: boolean }> = [];
    let totalChars = 0;

    if (pagesRaw.length > 0) {
      for (const p of pagesRaw) {
        const cleaned = sanitizeExtractedText(p.text || '');
        totalChars += cleaned.length;
        pages.push({
          pageNumber: p.num || pages.length + 1,
          text: cleaned,
          isEmpty: cleaned.length === 0,
        });
      }
    } else {
      const cleaned = sanitizeExtractedText((result as any)?.text || '');
      totalChars = cleaned.length;
      pages.push({
        pageNumber: 1,
        text: cleaned,
        isEmpty: cleaned.length === 0,
      });
    }

    const avgCharsPerPage = totalChars / numPages;
    return {
      hasUsableText: avgCharsPerPage >= 20,
      pages,
      totalChars,
    };
  } catch (err: any) {
    return {
      hasUsableText: false,
      pages: [],
      totalChars: 0,
      error: `PDF text layer parsing error: ${err.message}`,
    };
  }
}

/**
 * Executes multimodal visual OCR using Google Gemini (configured Gemini model)
 * for scanned manuscripts, colonial survey plates, architectural elevations, and images.
 */
async function extractWithGeminiOCR(
  buffer: Buffer,
  mimeType: string,
  documentTitle: string,
  documentId: string
): Promise<DocumentPageInsertInput[]> {
  const ai = getGeminiClient();
  const base64Data = buffer.toString('base64');

  const systemInstruction = `You are a scholarly archival palaeographer and OCR engine for the Archaeological Survey of India and Historical Heritage Archives.
Your task is to transcribe all textual inscriptions, epigraphs, labels, structural dimensions, signatures, dates, and marginalia from the provided document or image.
Strict rules:
1. Preserve original archaic orthography, Sanskrit/Devanagari ligatures, Gujarati, Persian, and colonial English syntax.
2. If text is damaged or illegible, mark it as [illegible] rather than inventing text.
3. If an image or page contains purely architectural diagrams or photographs with zero text, return empty string for extractedText and set isEmpty to true.
4. Provide a genuine confidence score between 0.0 and 1.0 reflecting handwriting legibility or scan degradation.`;

  const prompt = `Perform complete transcription of the uploaded archival folio: "${documentTitle}". Organise the response by page with detected language, confidence score, and word count.`;

  const modelsToAttempt = [getGeminiModel(), getGeminiFallbackModel()];
  let lastError: any = null;

  for (const modelName of modelsToAttempt) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType === 'application/pdf' ? 'application/pdf' : (mimeType || 'image/jpeg'),
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pageNumber: { type: Type.INTEGER },
                    extractedText: { type: Type.STRING },
                    isEmpty: { type: Type.BOOLEAN },
                    detectedLanguage: { type: Type.STRING },
                    confidenceScore: { type: Type.NUMBER },
                  },
                  required: ['pageNumber', 'extractedText', 'isEmpty'],
                },
              },
            },
            required: ['pages'],
          },
        },
      });

      const rawJson = response.text || '{}';
      const parsed = JSON.parse(rawJson);
      const pagesArray: any[] = Array.isArray(parsed.pages) ? parsed.pages : [];

      if (pagesArray.length === 0) {
        // Single page fallback if JSON structure had empty array
        return [
          {
            document_id: documentId,
            page_number: 1,
            extracted_text: '',
            extraction_method: 'gemini_multimodal_ocr',
            extraction_status: 'empty_page',
            confidence_score: 1.0,
            word_count: 0,
            detected_language: 'en',
          },
        ];
      }

      return pagesArray.map((p, idx) => {
        const pageNum = Number(p.pageNumber) || idx + 1;
        const text = sanitizeExtractedText(p.extractedText || '');
        const wordCount = computeWordCount(text);
        const conf = calculateConfidenceScore('gemini_multimodal_ocr', text, p.confidenceScore);
        const status = classifyPageStatus(text, conf);

        return {
          document_id: documentId,
          page_number: pageNum,
          extracted_text: text,
          extraction_method: 'gemini_multimodal_ocr' as ExtractionMethod,
          extraction_status: status,
          confidence_score: conf,
          word_count: wordCount,
          detected_language: p.detectedLanguage || 'en',
        };
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini OCR attempt with model ${modelName} failed:`, err.message || err);
      // Wait 1.2 seconds before trying fallback model
      await new Promise((res) => setTimeout(res, 1200));
    }
  }

  throw new Error(`Gemini Multimodal OCR failed across available models: ${lastError?.message || lastError}`);
}

/**
 * Main coordinator pipeline: handles PDF text layer vs Gemini OCR, updates status,
 * persists page-level provenance, and prevents concurrent runs.
 */
export async function processDocumentExtraction(documentId: string): Promise<{
  success: boolean;
  documentId: string;
  method?: ExtractionMethod;
  pages?: DocumentPageRecord[];
  error?: string;
}> {
  // Prevent duplicate concurrent runs for the same document
  if (activeProcessingJobs.has(documentId)) {
    return {
      success: false,
      documentId,
      error: 'A text extraction job is already actively processing for this document.',
    };
  }

  activeProcessingJobs.add(documentId);

  try {
    // 1. Fetch document metadata
    const doc = await getDocumentById(documentId);
    if (!doc) {
      return { success: false, documentId, error: 'Document not found.' };
    }

    // 2. Set status to processing
    await updateDocumentStatus(documentId, 'processing');

    // 3. Download the private file from Supabase Storage
    const { buffer, error: dlError } = await downloadDocumentBuffer(doc.storage_path);
    if (dlError || !buffer) {
      await updateDocumentStatus(documentId, 'failed');
      return {
        success: false,
        documentId,
        error: `Failed to retrieve document binary from storage: ${dlError || 'Buffer empty'}`,
      };
    }

    let pagesToSave: DocumentPageInsertInput[] = [];
    let chosenMethod: ExtractionMethod = 'gemini_multimodal_ocr';

    // 4. Extraction Strategy Branching
    if (doc.mime_type === 'application/pdf') {
      // Step A: Inspect native PDF text layer
      const layerResult = await extractPdfTextLayer(buffer);
      const route = determineExtractionRoute(
        doc.mime_type,
        layerResult.totalChars,
        layerResult.pages.length
      );

      if (route.route === 'pdf_text_layer' && layerResult.hasUsableText) {
        chosenMethod = 'pdf_text_layer';
        pagesToSave = layerResult.pages.map((p) => {
          const wordCount = computeWordCount(p.text);
          const conf = calculateConfidenceScore(
            p.isEmpty ? 'empty_page_marker' : 'pdf_text_layer',
            p.text
          );
          const status = classifyPageStatus(p.text, conf);

          return {
            document_id: documentId,
            page_number: p.pageNumber,
            extracted_text: p.text,
            extraction_method: p.isEmpty ? ('empty_page_marker' as ExtractionMethod) : ('pdf_text_layer' as ExtractionMethod),
            extraction_status: status,
            confidence_score: conf,
            word_count: wordCount,
            detected_language: doc.language || 'en',
          };
        });
      } else {
        // Step B: Scanned PDF -> Visual OCR via Gemini
        chosenMethod = 'gemini_multimodal_ocr';
        pagesToSave = await extractWithGeminiOCR(
          buffer,
          doc.mime_type,
          doc.title,
          documentId
        );
      }
    } else {
      // Images (JPEG, PNG, WebP) -> Direct Gemini Multimodal OCR
      chosenMethod = 'gemini_multimodal_ocr';
      pagesToSave = await extractWithGeminiOCR(
        buffer,
        doc.mime_type,
        doc.title,
        documentId
      );
    }

    // 5. Persist pages to Supabase / local vault with foreign key provenance
    const { success: saveSuccess, pages: savedPages, error: saveError } =
      await saveDocumentPages(pagesToSave);

    if (!saveSuccess) {
      await updateDocumentStatus(documentId, 'failed');
      return {
        success: false,
        documentId,
        error: `Failed to persist extracted pages: ${saveError}`,
      };
    }

    // 6. Update document status based on extraction results
    const hasAnyNeedsReview = savedPages.some((p) => p.extraction_status === 'needs_review');
    const finalDocStatus = hasAnyNeedsReview ? 'needs_review' : 'completed';

    await updateDocumentStatus(documentId, finalDocStatus);

    return {
      success: true,
      documentId,
      method: chosenMethod,
      pages: savedPages,
    };
  } catch (err: any) {
    await updateDocumentStatus(documentId, 'failed');
    return {
      success: false,
      documentId,
      error: `Processing error: ${err.message}`,
    };
  } finally {
    activeProcessingJobs.delete(documentId);
  }
}

/**
 * Retrieves page records and current processing status for a document.
 */
export async function getDocumentExtractionStatus(documentId: string): Promise<{
  document: any | null;
  pages: DocumentPageRecord[];
}> {
  const doc = await getDocumentById(documentId);
  const pages = await getDocumentPages(documentId);
  return { document: doc, pages };
}
