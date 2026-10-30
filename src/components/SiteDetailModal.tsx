/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeritageSite, ArchivalDocument } from '../types';
import { X, Bookmark, BookmarkCheck, CheckCircle2, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { HeritageImage } from './HeritageImage';

interface SiteDetailModalProps {
  site: HeritageSite | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (site: HeritageSite) => void;
  archiveDocuments: ArchivalDocument[];
  onOpenDocument: (docId: string) => void;
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  site,
  onClose,
  isSaved,
  onToggleSave,
  archiveDocuments,
  onOpenDocument,
}) => {
  if (!site) return null;

  const heroMedia = site.media[0];
  const relatedDocs = archiveDocuments.filter((d) => d.related_site_slugs.includes(site.slug));

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

        {/* Hero Photo with Attribution */}
        {heroMedia && (
          <div className="overflow-hidden rounded-xl border border-[#DCC9AD]">
            <HeritageImage
              media={heroMedia}
              siteName={site.name}
              category={site.category}
              className="aspect-[16/9] w-full"
              showAttribution={false}
            />
            <div className="flex flex-wrap items-center justify-between bg-stone-900/90 px-3 py-1.5 text-[11px] text-stone-300">
              <span>Photo: {heroMedia.photographer} &bull; {heroMedia.license}</span>
              <a
                href={heroMedia.source_url}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white"
              >
                Source URL
              </a>
            </div>
          </div>
        )}

        {/* Title & Metadata */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#DCC9AD] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#B65F43]/15 px-2.5 py-0.5 text-xs font-semibold text-[#B65F43]">
                {site.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#667653]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {site.verification === 'verified' ? 'Verified Heritage Record' : 'Community Archive'}
              </span>
            </div>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#292821]">{site.name}</h2>
            <p className="mt-0.5 text-xs text-[#777267]">
              {site.district ? site.district + ', ' : ''}{site.state} &bull; Period: {site.period || 'Historical'}
            </p>
          </div>

          <button
            onClick={() => onToggleSave(site)}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              isSaved
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-[#292821] bg-white text-[#292821] hover:bg-[#F8F5EF]'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-emerald-600" />
                <span>Saved in Passport</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Save to Collection</span>
              </>
            )}
          </button>
        </div>

        {/* Description & Historical Narrative */}
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#292821]">
          <p>{site.description}</p>
          {site.story && (
            <div className="rounded-lg border-l-4 border-[#667653] bg-[#F8F5EF] p-4 italic">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#667653] not-italic mb-1">
                Local Historical Narrative:
              </span>
              {site.story}
            </div>
          )}
        </div>

        {/* Linked Archival Records */}
        {relatedDocs.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#DCC9AD] bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B65F43]">
              <BookOpen className="h-4 w-4" />
              <span>Preserved Primary Archival Records for this Site</span>
            </div>
            <div className="mt-2 space-y-2">
              {relatedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-[#DCC9AD] bg-white p-3 text-xs shadow-xs"
                >
                  <div>
                    <strong className="text-[#292821]">{doc.title}</strong>
                    <div className="text-[11px] text-[#777267]">
                      {doc.author_or_creator} &bull; {doc.period_date} &bull; {doc.source_archive}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenDocument(doc.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded bg-[#B65F43] px-3 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <span>Read Folio</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Attribution Footer */}
        <div className="mt-6 border-t border-[#DCC9AD]/70 pt-3 text-xs text-[#777267]">
          <span>Source Attribution: <strong>{site.source || 'Historical Survey Record'}</strong></span>
        </div>
      </div>
    </div>
  );
};
