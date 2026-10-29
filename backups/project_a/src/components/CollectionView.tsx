import React, { useState, useEffect } from 'react';
import { SEED_HERITAGE_SITES, HeritageSiteItem } from '../data/seedHeritageSites';
import { Bookmark, Award, Trash2, ExternalLink } from 'lucide-react';

interface CollectionViewProps {
  onNavigateToSite: (slug: string) => void;
  onNavigateToExplore: () => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  onNavigateToSite,
  onNavigateToExplore
}) => {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('saved_heritage_sites') || '[]');
      setSavedSlugs(stored);
    } catch {
      // ignore
    }
  }, []);

  const handleRemove = (slug: string) => {
    const updated = savedSlugs.filter(s => s !== slug);
    setSavedSlugs(updated);
    try {
      localStorage.setItem('saved_heritage_sites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const savedSites = SEED_HERITAGE_SITES.filter(s => savedSlugs.includes(s.slug));

  const badges = [
    {
      title: 'Gujarat Heritage Pioneer',
      description: 'Saved your first monument from northern Gujarat stepwell heritage.',
      earned: savedSlugs.length > 0
    },
    {
      title: 'Stepwell Enthusiast',
      description: 'Explored and saved multiple subterranean stepwell architectures.',
      earned: savedSites.some(s => s.category === 'Stepwells')
    },
    {
      title: 'Knowledge Cartographer',
      description: 'Engaged with the Step 8 Heritage Knowledge Graph.',
      earned: true
    }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="border-b border-[#DCC9AD] pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821]">
          My Collection
        </h1>
        <p className="mt-2 text-sm text-[#777267]">
          Saved architectural records, field notes, and earned archival research badges.
        </p>
      </div>

      {/* Badges Section */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#292821] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#C27803]" />
          <span>Earned Research Badges</span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                b.earned
                  ? 'bg-white border-[#C27803]/40 shadow-xs'
                  : 'bg-[#F8F5EF]/60 border-[#DCC9AD]/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C27803]">
                <Award className="w-4 h-4" />
                <span>{b.earned ? 'Earned' : 'Locked'}</span>
              </div>
              <h3 className="font-serif font-bold text-base text-[#292821] mt-1">
                {b.title}
              </h3>
              <p className="text-xs text-[#777267] mt-1 leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Saved Heritage Records */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#292821] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#B65F43]" />
            <span>Saved Heritage Records ({savedSites.length})</span>
          </h2>
        </div>

        {savedSites.length === 0 ? (
          <div className="bg-white border border-[#DCC9AD] rounded-2xl p-8 text-center space-y-3">
            <p className="font-serif text-lg font-bold text-[#292821]">No heritage places saved yet.</p>
            <p className="text-xs text-[#777267]">
              Explore the archive map or knowledge graph and click &quot;Save Place&quot; to bookmark them here.
            </p>
            <button
              onClick={onNavigateToExplore}
              type="button"
              className="px-4 py-2 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors"
            >
              Explore Heritage Archive
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedSites.map(site => (
              <div
                key={site.id}
                className="bg-white border border-[#DCC9AD] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#B65F43] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#777267]">
                    <span className="font-mono text-[10px] uppercase bg-[#B65F43]/10 text-[#B65F43] px-2 py-0.5 rounded font-medium">
                      {site.category}
                    </span>
                    <button
                      onClick={() => handleRemove(site.slug)}
                      type="button"
                      title="Remove from saved"
                      aria-label="Remove from saved"
                      className="p-1 text-[#777267] hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#292821] mt-2">
                    {site.name}
                  </h3>

                  <p className="text-xs text-[#777267] mt-0.5">
                    {site.district ? `${site.district}, ` : ''}
                    {site.state}
                  </p>

                  <p className="text-xs text-[#292821] line-clamp-2 mt-2 leading-relaxed">
                    {site.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DCC9AD]/40">
                  <button
                    onClick={() => onNavigateToSite(site.slug)}
                    type="button"
                    className="text-xs text-[#B65F43] font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Dossier</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CollectionView;
