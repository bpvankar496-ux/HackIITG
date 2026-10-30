/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiModel } from './geminiModels.ts';

export interface OcrResult {
  title: string;
  authorOrSource: string;
  periodOrEra: string;
  scriptLanguage: string;
  transcription: string;
  detectedMonuments: string[];
  historicalEntities: string[];
  summary: string;
}

export async function processArchivalDocumentOcr(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert paleographer, epigraphist, and architectural historian working on the revitalisation of cultural archives.
Analyze this scanned historical document, manuscript page, or architectural inscription:
1. Transcribe the visible text verbatim as accurately as possible. Preserve line-breaks or folio layout if discernible.
2. If text is in Sanskrit/Prakrit/Persian/old script, provide both the original transcription and an accurate English translation.
3. Extract archival metadata:
   - title (a descriptive archival title for this folio/record)
   - authorOrSource (author, surveyor, or scribal tradition)
   - periodOrEra (estimated century or historical dynasty)
   - scriptLanguage (e.g., "Sanskrit in Devanagari script", "Colonial English", "Persian nasta'liq")
   - detectedMonuments (array of monument names mentioned, e.g. ["Rani ki Vav", "Modhera Sun Temple"])
   - historicalEntities (array of patrons, rulers, architects, or clans mentioned)
   - summary (2-3 sentences providing historical context for researchers)

Format your response as valid, pure JSON without markdown backticks:
{
  "title": "string",
  "authorOrSource": "string",
  "periodOrEra": "string",
  "scriptLanguage": "string",
  "transcription": "string",
  "detectedMonuments": ["string"],
  "historicalEntities": ["string"],
  "summary": "string"
}
`;

  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const rawText = response.text || '{}';
  try {
    const parsed = JSON.parse(rawText);
    return {
      title: parsed.title || 'Archival Document Folio',
      authorOrSource: parsed.authorOrSource || 'Historical Record',
      periodOrEra: parsed.periodOrEra || 'Historical Era',
      scriptLanguage: parsed.scriptLanguage || 'Historical Script',
      transcription: parsed.transcription || 'No textual content could be transcribed.',
      detectedMonuments: Array.isArray(parsed.detectedMonuments) ? parsed.detectedMonuments : [],
      historicalEntities: Array.isArray(parsed.historicalEntities) ? parsed.historicalEntities : [],
      summary: parsed.summary || 'Transcribed archival record.',
    };
  } catch {
    return {
      title: 'Transcribed Archival Record',
      authorOrSource: 'Unknown Historical Source',
      periodOrEra: 'Unspecified Era',
      scriptLanguage: 'Manuscript Script',
      transcription: rawText,
      detectedMonuments: [],
      historicalEntities: [],
      summary: 'Extracted historical text from uploaded document scan.',
    };
  }
}
