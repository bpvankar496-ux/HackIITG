/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  MapPin,
  Globe,
  HardDrive,
  ShieldCheck,
  ExternalLink,
  Lock,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { DocumentRecord, DocumentPageRecord, ProcessingStatus } from '../types/database.types';
import { formatBytes } from '../utils/uploadValidation';
import { getAuthHeaders } from '../lib/supabase';

interface DocumentDetailModalProps {
  document: DocumentRecord | null;
  initialPageNumber?: number;
  onClose: () => void;
  onStatusUpdated?: (documentId: string, status: ProcessingStatus) => void;
}

type SourceAssetAvailability = {
  available: boolean;
  reason?: 'missing' | 'storage_unavailable';
};

const isMissingSourceError = (message: string): boolean =>
  /original source file is unavailable in archive storage|object not found/i.test(message);

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  initialPageNumber = 1,
  onClose,
  onStatusUpdated,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // OCR Extraction State
  const [pages, setPages] = useState<DocumentPageRecord[]>([]);
  const [selectedPageNum, setSelectedPageNum] = useState<number>(initialPageNumber);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [pageLoadError, setPageLoadError] = useState<string | null>(null);
  const [sourceAsset, setSourceAsset] = useState<SourceAssetAvailability | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [copiedPage, setCopiedPage] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<string>(
    document?.processing_status || 'uploaded'
  );

  useEffect(() => {
    if (document) {
      setCurrentStatus(document.processing_status);
      setPages([]);
      setSourceAsset(null);
      setSignedUrl(null);
      setUrlError(null);
      setProcessingError(null);
      fetchDocumentPages(document.id);
      setSelectedPageNum(initialPageNumber);
    }
  }, [document, initialPageNumber]);

  const fetchDocumentPages = async (docId: string) => {
    setLoadingPages(true);
    setPageLoadError(null);
    try {
      const res = await fetch(`/api/documents/pages?documentId=${encodeURIComponent(docId)}`, {
        headers: await getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Page request failed (${res.status}).`);
      }
      const loadedPages: DocumentPageRecord[] = Array.isArray(data.pages) ? data.pages : [];
      setPages(loadedPages);
      if (data.sourceAsset && typeof data.sourceAsset.available === 'boolean') {
        setSourceAsset(data.sourceAsset as SourceAssetAvailability);
      }
      if (data.document?.processing_status) setCurrentStatus(data.document.processing_status);
      if (loadedPages.length > 0) {
        setSelectedPageNum(
          loadedPages.some((page) => page.page_number === initialPageNumber)
            ? initialPageNumber
            : loadedPages[0].page_number
        );
      }
    } catch (err: any) {
      setPages([]);
      setPageLoadError(err.message || 'Could not load folio pages.');
      setSourceAsset({ available: false, reason: 'storage_unavailable' });
    } finally {
      setLoadingPages(false);
    }
  };

  const handleRunOcrExtraction = async () => {
    if (!document) return;
    if (sourceAsset?.reason === 'missing') {
      setProcessingError(
        'OCR cannot run because the original source file is unavailable in archive storage.'
      );
      return;
    }
    if (!sourceAsset) {
      setProcessingError('The original source file is still being checked. Please wait a moment and try again.');
      return;
    }
    setIsProcessing(true);
    setProcessingError(null);

    try {
      const res = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ documentId: document.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Text extraction and OCR pipeline failed.');
      }

      const processedPages: DocumentPageRecord[] = Array.isArray(data.pages) ? data.pages : [];
      setPages(processedPages);
      setSelectedPageNum(1);
      const status: ProcessingStatus = processedPages.some(
        (page: DocumentPageRecord) => page.extraction_status === 'needs_review'
      )
        ? 'needs_review'
        : 'completed';
      setCurrentStatus(status);
      onStatusUpdated?.(document.id, status);
    } catch (err: any) {
      const message = err.message || 'Error executing OCR pipeline.';
      if (isMissingSourceError(message)) {
        setSourceAsset({ available: false, reason: 'missing' });
        setProcessingError(null);
        return;
      }
      setProcessingError(message);
      setCurrentStatus('failed');
      onStatusUpdated?.(document.id, 'failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestSignedUrl = async () => {
    if (!document) return;
    if (sourceAsset?.reason === 'missing') {
      setUrlError(
        'The original source file is unavailable in archive storage.'
      );
      return;
    }
    if (!sourceAsset) {
      setUrlError('The original source file is still being checked. Please wait a moment and try again.');
      return;
    }
    setLoadingUrl(true);
    setUrlError(null);

    try {
      const res = await fetch('/api/documents/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          storagePath: document.storage_path,
          expiresInSeconds: 300, // 5 minutes
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to generate secure preview URL.');
      }

      setSignedUrl(data.signedUrl);
    } catch (err: any) {
      const message = err.message || 'Error creating signed access URL.';
      if (isMissingSourceError(message)) {
        setSourceAsset({ available: false, reason: 'missing' });
        setSignedUrl(null);
        setUrlError(null);
        return;
      }
      setUrlError(message);
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPage(true);
    setTimeout(() => setCopiedPage(false), 2000);
  };

  if (!document) return null;

  const isImage = document.mime_type.startsWith('image/');
  const activePage = pages.find((p) => p.page_number === selectedPageNum) || pages[0];
  const sourceCheckPending = sourceAsset === null;
  const sourceIsMissing = sourceAsset?.reason === 'missing';
  const sourceUnavailableMessage = sourceAsset?.reason === 'missing'
    ? 'The original scan is not stored in the archive bucket. Existing transcribed folios remain available below, but preview and OCR cannot run for this record.'
    : 'Archive storage could not be reached to verify the original source file. You can try OCR or preview again when the connection is restored.';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Extracted &amp; Structured
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            <RefreshCw className="h-3 w-3 animate-spin" />
            OCR In Progress
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            <HelpCircle className="h-3 w-3" />
            Needs Review
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" />
            Extraction Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700 border border-stone-200">
            Uploaded (Pending OCR)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#C9BBA2] bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#6B6860] hover:bg-[#F4EFE6] transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[#E2D7C3] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-[#F4EFE6] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#B38E46] border border-[#E2D7C3]">
              {document.document_type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-[#8E8A81]">&bull;</span>
            {getStatusBadge(currentStatus)}
            <span className="text-[#6B6860]">
              {document.verification_status === 'verified'
                ? 'Verified Record'
                : 'Unverified Archival Ingestion'}
            </span>
          </div>

          <h2 className="mt-2 font-serif text-2xl font-bold text-[#16192E]">
            {document.title}
          </h2>
          <p className="mt-1 text-xs text-[#6B6860]">
            Original Filename: <code className="font-mono text-[#16192E]">{document.original_filename}</code> &bull; {formatBytes(document.file_size_bytes)} &bull; {document.mime_type}
          </p>
        </div>

        {/* Step 4: Text Extraction & OCR Pipeline Section */}
        <div className="mt-5 rounded-xl border border-[#B38E46]/30 bg-radial from-[#FBF9F4] to-[#F4EFE6] p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#B38E46]" />
                <h3 className="font-serif text-base font-bold text-[#16192E]">
                  Text Extraction &amp; OCR Provenance
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#6B6860]">
                Extracts text-layer streams from digital PDFs or runs multimodal visual OCR for scanned manuscripts, colonial survey plates, and epigraphs.
              </p>
            </div>

            {sourceCheckPending ? (
              <span className="text-xs text-[#8E8A81]">Checking original source…</span>
            ) : sourceIsMissing ? (
              <span className="text-xs text-[#8E8A81]">Original source unavailable</span>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRunOcrExtraction}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B38E46] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9F7628] transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Extracting Inscriptions…</span>
                  </>
                ) : pages.length > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Re-run OCR Pipeline</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run Text Extraction &amp; OCR</span>
                  </>
                )}
              </button>
            )}
          </div>

          {processingError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Pipeline Error: </strong>
                <span>{processingError}</span>
              </div>
            </div>
          )}

          {pageLoadError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div><strong>Page loading failed: </strong>{pageLoadError}</div>
            </div>
          )}

          {sourceAsset && !sourceAsset.available && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{sourceUnavailableMessage}</span>
            </div>
          )}

          {/* Extracted Pages Viewer */}
          {loadingPages ? (
            <div className="mt-4 flex items-center justify-center py-8 text-xs text-[#8E8A81]">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading archival transcription pages…
            </div>
          ) : pages.length > 0 ? (
            <div className="mt-4 rounded-lg border border-[#E2D7C3] bg-white overflow-hidden shadow-xs">
              {/* Page Navigator Tabs & Method Header */}
              <div className="border-b border-[#E2D7C3] bg-[#FAF8F5] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-semibold text-[#8E8A81] mr-1 flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Folio Pages:
                  </span>
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPageNum(p.page_number)}
                      className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                        selectedPageNum === p.page_number
                          ? 'bg-[#16192E] text-white shadow-xs'
                          : 'bg-[#F4EFE6] text-[#6B6860] hover:bg-[#EAE2D2]'
                      }`}
                    >
                      Page {p.page_number}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#8E8A81]">Method:</span>
                  <span className="rounded bg-[#EDE5D5] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#16192E]">
                    {activePage?.extraction_method === 'pdf_text_layer'
                      ? 'PDF Text Layer'
                      : activePage?.extraction_method === 'gemini_multimodal_ocr'
                      ? 'Gemini Multimodal OCR'
                      : 'Empty Page Marker'}
                  </span>
                  {activePage?.confidence_score !== null && (
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-mono font-bold ${
                        activePage.confidence_score >= 0.8
                          ? 'bg-emerald-100 text-emerald-800'
                          : activePage.confidence_score >= 0.5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                      title="Archival transcription confidence score"
                    >
                      Confidence: {(activePage.confidence_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Active Page Text Container */}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-[#8E8A81] mb-2">
                  <div className="flex items-center gap-3">
                    <span>
                      Words: <strong className="text-[#16192E] font-mono">{activePage?.word_count || 0}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Language:{' '}
                      <strong className="text-[#16192E] font-mono uppercase">
                        {activePage?.detected_language || 'EN'}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Page Status:{' '}
                      <span
                        className={`font-semibold ${
                          activePage?.extraction_status === 'completed'
                            ? 'text-emerald-700'
                            : activePage?.extraction_status === 'empty_page'
                            ? 'text-stone-500'
                            : 'text-amber-700'
                        }`}
                      >
                        {activePage?.extraction_status}
                      </span>
                    </span>
                  </div>

                  {activePage?.extracted_text && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(activePage.extracted_text)}
                      className="inline-flex items-center gap-1 rounded bg-[#F4EFE6] px-2 py-1 text-xs text-[#6B6860] hover:text-[#16192E] transition-colors"
                      title="Copy page transcription to clipboard"
                    >
                      {copiedPage ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Page Text</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {activePage?.extraction_status === 'empty_page' || !activePage?.extracted_text ? (
                  <div className="rounded-lg border border-dashed border-[#C9BBA2] bg-[#FAF8F5] p-6 text-center text-xs text-[#8E8A81]">
                    <FileText className="mx-auto h-6 w-6 text-[#C9BBA2] mb-1.5" />
                    <p className="font-medium text-[#6B6860]">
                      No textual inscriptions detected on Page {activePage?.page_number}.
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8E8A81]">
                      This folio is an architectural drawing, photographic plate, or blank endpaper.
                    </p>
                  </div>
                ) : (
                  <div className="relative max-h-72 overflow-y-auto rounded-lg border border-[#E2D7C3] bg-[#FAF8F5] p-4 font-mono text-xs text-[#16192E] leading-relaxed whitespace-pre-wrap selection:bg-[#B38E46]/20">
                    {activePage.extracted_text}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#C9BBA2] bg-[#FAF8F5] p-4 text-center text-xs text-[#8E8A81]">
              <p className="font-medium text-[#6B6860]">
                {sourceAsset?.reason === 'missing'
                  ? 'The original source file is unavailable, so OCR cannot be run for this record.'
                  : currentStatus === 'completed' || currentStatus === 'needs_review'
                  ? 'No folio page records are available for this document.'
                  : currentStatus === 'failed'
                  ? 'Text extraction failed before page records were saved.'
                  : 'This document has not been transcribed yet.'}
              </p>
              <p className="mt-0.5 text-[11px]">
                {sourceAsset?.reason === 'missing'
                  ? 'Upload the authentic original scan through Deposit Folio to create a new OCR-ready record.'
                  : currentStatus === 'completed' || currentStatus === 'needs_review'
                  ? 'The catalogue metadata exists, but no extracted folio content is stored. No page content is inferred.'
                  : 'Click Run Text Extraction & OCR above to process the original document.'}
              </p>
            </div>
          )}
        </div>

        {/* Secure File Access & Preview Area */}
        <div className="mt-5 rounded-xl border border-[#E2D7C3] bg-[#FBF9F4] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#16192E]">
              <Lock className="h-4 w-4 text-[#B38E46]" />
              <span>Private Storage Object Access</span>
            </div>
            <span className="rounded bg-[#EDE5D5] px-2 py-0.5 text-[10px] font-mono text-[#6B6860]">
              Storage: historical_archives
            </span>
          </div>

          <p className="mt-1.5 text-[11px] text-[#6B6860] leading-relaxed">
            {!sourceCheckPending && !sourceIsMissing
              ? 'This historical asset is protected in private cloud storage. To view or download, generate a short-lived cryptographically signed URL (valid for 5 minutes).'
              : sourceIsMissing
              ? 'No original binary is stored for this legacy archive record, so a preview link cannot be created.'
              : sourceCheckPending
              ? 'Checking whether the original binary is available in private archive storage.'
              : 'Archive storage could not be reached. You can try generating a preview link again.'}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {!sourceCheckPending && !sourceIsMissing && !signedUrl ? (
              <button
                type="button"
                disabled={loadingUrl}
                onClick={handleRequestSignedUrl}
                className="flex items-center gap-1.5 rounded-lg bg-[#16192E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#272B40] transition-colors disabled:opacity-50"
              >
                {loadingUrl ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Authorizing…</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-[#C9A45C]" />
                    <span>Generate Authenticated Preview Link</span>
                  </>
                )}
              </button>
            ) : !sourceCheckPending && !sourceIsMissing && signedUrl ? (
              <div className="flex items-center gap-3">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#B38E46] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#9F7628] transition-colors"
                >
                  <span>Open Document Asset in New Tab</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={handleRequestSignedUrl}
                  className="text-xs text-[#6B6860] underline hover:text-[#16192E]"
                >
                  Regenerate Link
                </button>
              </div>
            ) : null}
          </div>

          {urlError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{urlError}</span>
            </div>
          )}

          {/* Embedded Inline Preview if signedUrl available and is image */}
          {signedUrl && isImage && (
            <div className="mt-4 overflow-hidden rounded-lg border border-[#E2D7C3] bg-stone-900 max-h-64 flex items-center justify-center">
              <img
                src={signedUrl}
                alt={document.title}
                className="max-h-64 w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-[#E2D7C3] bg-white p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A81]">
              Historical Era / Period
            </span>
            <div className="mt-1 font-medium text-[#16192E]">
              {document.historical_period || 'Not specified'}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2D7C3] bg-white p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A81]">
              Original Language / Script
            </span>
            <div className="mt-1 font-medium text-[#16192E]">
              {document.language || 'English'}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2D7C3] bg-white p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A81]">
              Location / Landmark
            </span>
            <div className="mt-1 font-medium text-[#16192E]">
              {document.location_name || 'Not localized'}
              {document.latitude && document.longitude && (
                <span className="block text-[11px] text-[#6B6860] font-mono">
                  Coordinates: {document.latitude.toFixed(4)}, {document.longitude.toFixed(4)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2D7C3] bg-white p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A81]">
              Source Collection / Archive
            </span>
            <div className="mt-1 font-medium text-[#16192E]">
              {document.source_name || 'Virasat Quest Primary Archive'}
            </div>
          </div>

          <div className="sm:col-span-2 rounded-lg border border-[#E2D7C3] bg-white p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A81]">
              Attribution &amp; Rights
            </span>
            <div className="mt-1 text-[#16192E]">
              {document.attribution || 'Public Archival Access'}
            </div>
          </div>

          {document.description && (
            <div className="sm:col-span-2 rounded-lg border border-[#E2D7C3] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A81]">
                Archival Description
              </span>
              <p className="mt-1 text-[#16192E] leading-relaxed">
                {document.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-[#E2D7C3] pt-4 flex items-center justify-between text-[11px] text-[#8E8A81]">
          <span>Uploaded on {new Date(document.created_at).toLocaleDateString()}</span>
          <span>Status: <strong className="text-[#16192E] uppercase font-mono">{currentStatus}</strong></span>
        </div>
      </div>
    </div>
  );
};
