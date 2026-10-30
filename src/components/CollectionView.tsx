/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SEED_HERITAGE_SITES } from '../data/seedHeritageSites';
import { useAuth } from '../contexts/AuthContext';
import { readSaved, toggleSaved, SAVED_EVENT } from '../lib/savedSites';
import { Bookmark, Trash2, ExternalLink, MapPin, Landmark } from 'lucide-react';
import { HeritageImage } from './HeritageImage';

interface CollectionViewProps {
  onNavigateToSite: (slug: string) => void;
  onNavigateToExplore: () => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  onNavigateToSite,
  onNavigateToExplore,
}) => {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    const refresh = () => setSavedSlugs(readSaved());
    refresh();
    window.addEventListener(SAVED_EVENT, refresh);
    return () => window.removeEventListener(SAVED_EVENT, refresh);
  }, []);

  const handleRemove = (slug: string) => {
    void toggleSaved(slug, user?.id);
  };

  const savedSites = SEED_HERITAGE_SITES.filter((s) => savedSlugs.includes(s.slug));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#DCC9AD] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="h-4 w-4 text-[#B65F43]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B65F43]">
              Personal Research Passport
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821]">
            Saved Heritage Records
          </h1>
          <p className="mt-1 text-sm text-[#777267] max-w-2xl">
            Bookmarked architectural monuments, historical sites, and field dossiers curated for your research reference.
          </p>
        </div>

        <div className="rounded-xl border border-[#DCC9AD] bg-white px-4 py-2 self-start sm:self-auto text-center shadow-2xs">
          <span className="text-[10px] uppercase font-mono text-[#777267] block">Saved Places</span>
          <span className="font-serif text-xl font-bold text-[#292821]">{savedSites.length}</span>
        </div>
      </div>

      {/* Main Saved List */}
      {savedSites.length === 0 ? (
        <div className="bg-white border border-[#DCC9AD] rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F0] border border-[#DCC9AD] flex items-center justify-center mx-auto text-[#777267]">
            <Bookmark className="w-6 h-6 text-[#B65F43]" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#292821]">No Saved Heritage Places</h2>
            <p className="text-xs text-[#777267] max-w-md mx-auto mt-1">
              While exploring the heritage database, interactive map, or knowledge graph, click &ldquo;Save Place&rdquo; to bookmark monuments here.
            </p>
          </div>
          <button
            onClick={onNavigateToExplore}
            type="button"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Explore Heritage Archive</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedSites.map((site) => (
            <div
              key={site.id}
              className="bg-white border border-[#DCC9AD] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#B65F43] transition-all"
            >
              <div>
                <HeritageImage
                  media={site.heritage_media?.[0]}
                  siteName={site.name}
                  category={site.category}
                  className="-mx-4 -mt-4 mb-3 aspect-[16/9] rounded-t-xl"
                />
                <div className="flex items-center justify-between text-xs text-[#777267]">
                  <span className="font-mono text-[10px] uppercase bg-[#B65F43]/10 text-[#B65F43] px-2 py-0.5 rounded font-medium">
                    {site.category}
                  </span>
                  <button
                    onClick={() => handleRemove(site.slug)}
                    type="button"
                    title="Remove from saved records"
                    aria-label="Remove from saved records"
                    className="p-1 text-[#777267] hover:text-red-700 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#292821] mt-2">
                  {site.name}
                </h3>

                <p className="text-xs text-[#777267] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B65F43] shrink-0" />
                  <span>
                    {site.district ? `${site.district}, ` : ''}
                    {site.state}
                  </span>
                </p>

                <p className="text-xs text-[#292821] line-clamp-2 mt-2 leading-relaxed">
                  {site.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#DCC9AD]/40 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#667653]">
                  {site.period || 'Historical Era'}
                </span>
                <button
                  onClick={() => onNavigateToSite(site.slug)}
                  type="button"
                  className="text-xs text-[#B65F43] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionView;
