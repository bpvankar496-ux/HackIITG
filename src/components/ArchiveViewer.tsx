/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArchivalDocument, HeritageSite } from '../types';
import { BookOpen, FileText, CheckCircle2, Copy, Check, ChevronLeft, ChevronRight, Landmark, ExternalLink } from 'lucide-react';

interface ArchiveViewerProps {
  documents: ArchivalDocument[];
  allSites: HeritageSite[];
  selectedDocumentId?: string;
  onSelectSite: (site: HeritageSite) => void;
  onOpenUploadModal: () => void;
}

export const ArchiveViewer: React.FC<ArchiveViewerProps> = ({
  documents,
  allSites,
  selectedDocumentId,
  onSelectSite,
  onOpenUploadModal,
}) => {
  const [activeDocId, setActiveDocId] = useState<string>(
    selectedDocumentId || documents[0]?.id || ''
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [scanUnavailable, setScanUnavailable] = useState<boolean>(false);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  useEffect(() => {
    setScanUnavailable(false);
  }, [activeDoc?.id, activeDoc?.original_scan_url]);

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'all') return true;
    return d.document_type === filterType;
  });

  const activePassage = activeDoc?.passages.find((p) => p.page_number === currentPage) || activeDoc?.passages[0];

  const relatedSites = allSites.filter((s) => activeDoc?.related_site_slugs.includes(s.slug));

  const copyCitation = () => {
    if (!activeDoc) return;
    const citationText = `${activeDoc.author_or_creator}. "${activeDoc.title}." (${activeDoc.period_date}). Preserved in ${activeDoc.source_archive}. Folio / Page ${currentPage}. Virasat  Archival Identifier: ${activeDoc.slug}.`;
    navigator.clipboard.writeText(citationText);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  if (!activeDoc) {
    return (
      <div className="p-8 text-center text-[#777267]">
        No archival records found in repository.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header & Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#DCC9AD] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#667653]/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#667653]">
              Archival Reading Room
            </span>
            <span className="text-xs text-[#777267]">
              {documents.length} catalogued historical documents
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#292821]">
            Unstructured Archival Vault
          </h1>
          <p className="mt-1 text-sm text-[#777267]">
            Side-by-side verification of original colonial surveys, Sanskrit manuscripts, and field logbooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-[#DCC9AD] bg-white px-3 py-1.5 text-sm text-[#292821]"
            aria-label="Filter documents by type"
          >
            <option value="all">All Document Types</option>
            <option value="survey_report">Survey Reports</option>
            <option value="manuscript">Manuscripts</option>
            <option value="field_notes">Field Notes</option>
          </select>

          {/* New Digitization Action */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 rounded bg-[#B65F43] px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            <span>Digitize New Folio</span>
          </button>
        </div>
      </div>

      {/* Document Selection Strip */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {filteredDocs.map((doc) => {
          const isSelected = doc.id === activeDoc.id;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setActiveDocId(doc.id);
                setCurrentPage(1);
              }}
              className={`flex min-w-[260px] max-w-[320px] flex-col rounded-lg border p-3 text-left transition-all ${
                isSelected
                  ? 'border-[#B65F43] bg-[#B65F43]/10 ring-1 ring-[#B65F43]'
                  : 'border-[#DCC9AD] bg-white hover:border-[#777267]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#777267]">
                <span className="font-semibold uppercase tracking-wider text-[#B65F43]">
                  {doc.document_type.replace('_', ' ')}
                </span>
                <span>{doc.period_date}</span>
              </div>
              <h3 className="mt-1 line-clamp-1 font-serif text-sm font-bold text-[#292821]">
                {doc.title}
              </h3>
              <p className="mt-0.5 text-xs text-[#777267] line-clamp-1">
                {doc.author_or_creator}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dual-Pane Archival Reading Room */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Pane: Original Artifact Scan (5 cols) */}
        <div className="flex flex-col rounded-xl border border-[#DCC9AD] bg-stone-900 p-4 text-stone-100 shadow-md lg:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-400">
                Original Artifact Scan
              </span>
              <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-300">
                Folio {currentPage} of {activeDoc.total_pages}
              </span>
            </div>
            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded p-1 text-stone-300 hover:bg-stone-800 disabled:opacity-40"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-stone-400">
                {currentPage} / {activeDoc.total_pages}
              </span>
              <button
                disabled={currentPage >= activeDoc.total_pages}
                onClick={() => setCurrentPage((p) => Math.min(activeDoc.total_pages, p + 1))}
                className="rounded p-1 text-stone-300 hover:bg-stone-800 disabled:opacity-40"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-stone-950">
            {activeDoc.original_scan_url ? (
              <img
                src={activeDoc.original_scan_url}
                alt={`Historical document scan of ${activeDoc.title}`}
                className="max-h-[520px] w-full object-contain p-2 transition-transform duration-300"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                  setScanUnavailable(true);
                }}
              />
            ) : null}
            <p
              data-scan-fallback
              hidden={Boolean(activeDoc.original_scan_url) && !scanUnavailable}
              className="max-w-xs p-6 text-center text-xs text-stone-300"
              role="status"
            >
              Original scan unavailable. This record has transcription metadata only.
            </p>
            <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[11px] text-stone-300 backdrop-blur-sm">
              Source: {activeDoc.source_archive}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
            <span>License: {activeDoc.license}</span>
            <span className="text-amber-300/80">
              {activeDoc.original_scan_url && !scanUnavailable ? 'Source scan attached' : 'No source scan available'}
            </span>
          </div>
        </div>

        {/* Right Pane: Transcribed Text & Archival Metadata (7 cols) */}
        <div className="flex flex-col rounded-xl border border-[#DCC9AD] bg-white p-6 shadow-md lg:col-span-7">
          {/* Document Title & Provenance */}
          <div className="border-b border-[#DCC9AD]/70 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#667653]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activeDoc.transcription_status === 'verified'
                  ? 'Verified Primary Source Transcription'
                  : 'AI-Extracted OCR Passage'}
              </span>
              <span className="text-xs text-[#777267]">
                Original Language: <strong>{activeDoc.original_language}</strong>
              </span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#292821]">
              {activeDoc.title}
            </h2>
            <p className="mt-1 text-sm text-[#777267]">
              By <strong>{activeDoc.author_or_creator}</strong> &bull; Period: {activeDoc.period_date}
            </p>
          </div>

          {/* Verbatim Passage Transcription */}
          <div className="my-5 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#777267]">
                Verbatim Passage Transcription (Page / Folio {currentPage})
              </h3>
              <span className="text-xs text-[#777267]">
                {activePassage?.passage_text.split(/\s+/).length || 0} words
              </span>
            </div>

            <div className="mt-2 rounded-lg border border-[#DCC9AD]/60 bg-[#F8F5EF] p-4 text-[#292821]">
              <p className="whitespace-pre-line font-serif text-base leading-relaxed italic">
                {activePassage?.passage_text || 'No transcribed text recorded for this folio page.'}
              </p>
            </div>

            {/* Key Entities Detected */}
            {activePassage?.key_entities && activePassage.key_entities.length > 0 && (
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#777267]">
                  Archival Entities & Historical Terms:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {activePassage.key_entities.map((entity, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-[#DCC9AD] bg-white px-2.5 py-0.5 text-xs font-medium text-[#292821]"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Physical Monuments */}
            {relatedSites.length > 0 && (
              <div className="mt-4 rounded-md border border-[#DCC9AD]/60 bg-amber-50/50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#B65F43]">
                  <Landmark className="h-3.5 w-3.5" />
                  Direct Physical Monuments Cited in This Document:
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {relatedSites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => onSelectSite(site)}
                      className="flex items-center gap-1 rounded bg-[#B65F43] px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <span>{site.name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scholarly Citation Box */}
          <div className="border-t border-[#DCC9AD]/70 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777267]">
                Scholarly Citation & Source Provenance
              </span>
              <button
                onClick={copyCitation}
                className="flex items-center gap-1 text-xs text-[#B65F43] hover:underline"
              >
                {copiedCitation ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Citation Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Citation</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-[#777267]">
              {activeDoc.author_or_creator}. &ldquo;{activeDoc.title}.&rdquo; ({activeDoc.period_date}). {activeDoc.source_archive}. Folio/Page {currentPage}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
