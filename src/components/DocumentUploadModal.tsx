/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ArchivalDocument } from '../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAdded: (doc: ArchivalDocument) => void;
}

const SAMPLE_ARCHIVE_PLATES = [
  {
    id: 'sample-1',
    name: '1888 Colonial Survey Plate: Somnath & Junagadh',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    description: 'Field notes and architectural drawings of western coastal fortifications.',
  },
  {
    id: 'sample-2',
    name: 'Sanskrit Palm-Leaf Inscription: Patan Hydraulic Works',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    description: 'Medieval Sanskrit epigraph on royal stepwell endowments in Patan.',
  },
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentAdded,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_ARCHIVE_PLATES[0].url);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Please select a valid image (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('File size must be under 8 MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setImageBase64(b64);
      setSelectedImage(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let b64ToSend = imageBase64;

      // If a sample plate URL is chosen without local file upload, fetch and convert to base64
      if (!b64ToSend && selectedImage) {
        const resp = await fetch(selectedImage);
        const blob = await resp.blob();
        b64ToSend = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      if (!b64ToSend) {
        throw new Error('Please select or upload an archival plate image.');
      }

      const res = await fetch('/api/archive/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64ToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OCR extraction failed on server.');
      }

      setExtractedResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process document with Gemini OCR.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToArchive = () => {
    if (!extractedResult) return;

    const newDoc: ArchivalDocument = {
      id: `doc-${Date.now()}`,
      slug: (extractedResult.title || 'archival-doc')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30) + '-' + Date.now().toString().slice(-4),
      title: extractedResult.title,
      author_or_creator: extractedResult.authorOrSource,
      document_type: 'survey_report',
      period_date: extractedResult.periodOrEra,
      original_language: extractedResult.scriptLanguage,
      source_archive: 'Digitised via Virasat Quest Ingestion Pipeline',
      license: 'Public Archival Access',
      original_scan_url: selectedImage || SAMPLE_ARCHIVE_PLATES[0].url,
      transcription_status: 'ocr_extracted',
      total_pages: 1,
      summary: extractedResult.summary,
      historical_context: `Digitized using Gemini 2.5 Multi-Modal OCR from uploaded historical manuscript plate.`,
      created_at: new Date().toISOString(),
      passages: [
        {
          id: `p-${Date.now()}`,
          document_id: `doc-${Date.now()}`,
          page_number: 1,
          passage_text: extractedResult.transcription,
          key_entities: [
            ...(extractedResult.historicalEntities || []),
            ...(extractedResult.detectedMonuments || []),
          ],
        },
      ],
      related_site_slugs: ['rani-ki-vav'],
    };

    onDocumentAdded(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#DCC9AD] bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#777267] hover:bg-[#DCC9AD]/30"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#667653] text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#292821]">
              Digitize Historical Document with Gemini OCR
            </h2>
            <p className="text-xs text-[#777267]">
              Multi-modal transcription and metadata structuring for unstructured heritage archives.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Image Selection / Upload */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#777267]">
              1. Select or Upload Archival Plate
            </label>

            {/* Custom file upload input */}
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DCC9AD] p-4 text-center transition-colors hover:border-[#B65F43] bg-[#F8F5EF]/60">
              <UploadCloud className="h-8 w-8 text-[#B65F43]" />
              <span className="mt-2 text-xs font-medium text-[#292821]">
                Upload Scanned PDF or Image
              </span>
              <span className="text-[11px] text-[#777267]">JPG, PNG, or WebP up to 8MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Sample Plates for Instant Hackathon Demonstration */}
            <div className="mt-3">
              <span className="text-xs text-[#777267]">Or test with authentic historical sample:</span>
              <div className="mt-1.5 space-y-2">
                {SAMPLE_ARCHIVE_PLATES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setSelectedImage(sample.url);
                      setImageBase64('');
                      setExtractedResult(null);
                    }}
                    className={`w-full rounded-lg border p-2.5 text-left text-xs transition-all ${
                      selectedImage === sample.url
                        ? 'border-[#B65F43] bg-[#B65F43]/10 font-medium'
                        : 'border-[#DCC9AD] bg-white hover:border-[#777267]'
                    }`}
                  >
                    <div className="font-semibold text-[#292821]">{sample.name}</div>
                    <div className="text-[11px] text-[#777267]">{sample.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Image */}
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-[#777267]">
              Plate Preview
            </span>
            <div className="mt-2 flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#DCC9AD] bg-stone-900 p-2">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected historical manuscript plate"
                  className="max-h-56 w-full object-contain"
                />
              ) : (
                <div className="text-xs text-stone-400">No plate selected</div>
              )}
            </div>

            <button
              onClick={handleRunOcr}
              disabled={isProcessing}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#667653] py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isProcessing ? 'Transcribing with Gemini 2.5…' : 'Run Gemini Multi-Modal OCR'}</span>
            </button>
          </div>
        </div>

        {/* OCR Result View */}
        {extractedResult && (
          <div className="mt-6 rounded-xl border border-[#DCC9AD] bg-[#F8F5EF] p-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-sm font-bold text-[#667653]">
              <CheckCircle className="h-4 w-4" />
              <span>OCR Extraction & Metadata Structuring Complete</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#292821] sm:grid-cols-2">
              <div>
                <strong>Archival Title:</strong> {extractedResult.title}
              </div>
              <div>
                <strong>Author / Surveyor:</strong> {extractedResult.authorOrSource}
              </div>
              <div>
                <strong>Era / Period:</strong> {extractedResult.periodOrEra}
              </div>
              <div>
                <strong>Script & Language:</strong> {extractedResult.scriptLanguage}
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold uppercase text-[#777267]">
                Verbatim Transcription:
              </span>
              <div className="mt-1 max-h-36 overflow-y-auto rounded border border-[#DCC9AD] bg-white p-3 font-serif text-xs italic leading-relaxed text-[#292821]">
                {extractedResult.transcription}
              </div>
            </div>

            {extractedResult.historicalEntities?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {extractedResult.historicalEntities.map((ent: string, idx: number) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#B65F43] border border-[#DCC9AD]"
                  >
                    {ent}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleSaveToArchive}
                className="flex items-center gap-1.5 rounded-lg bg-[#B65F43] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <FileText className="h-4 w-4" />
                <span>Save to Archival Vault</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
