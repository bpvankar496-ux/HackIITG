import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { KnowledgeGraphView } from './components/knowledgeGraph/KnowledgeGraphView';
import { ExploreView } from './components/ExploreView';
import { QuestsView } from './components/QuestsView';
import { CommunityView } from './components/CommunityView';
import { ContributeView } from './components/ContributeView';
import { CollectionView } from './components/CollectionView';
import { HeritageDetailView } from './components/HeritageDetailView';
import { AdminImportView } from './components/AdminImportView';
import { ResearchAssistantView } from './components/ResearchAssistantView';
import { SEED_HERITAGE_ENTITIES, SEED_HERITAGE_RELATIONSHIPS } from './data/seedKnowledgeGraph';
import { SEED_HERITAGE_SITES } from './data/seedHeritageSites';
import { Network, Search, ArrowRight, Sparkles, BookOpen, MapPin, Compass, ShieldCheck } from 'lucide-react';

export default function App() {
  // Navigation tabs: 'home' | 'explore' | 'quests' | 'knowledge-graph' | 'community' | 'contribute' | 'collection' | 'admin-import' | 'heritage-detail'
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [activeSiteSlug, setActiveSiteSlug] = useState<string>('rani-ki-vav');
  const [graphTargetSlug, setGraphTargetSlug] = useState<string | undefined>(undefined);
  const [homeSearchInput, setHomeSearchInput] = useState('');

  // Handle URL hash changes for direct navigation and browser back/forward
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) {
        setCurrentRoute('home');
      } else if (hash.startsWith('heritage/')) {
        const slug = hash.replace('heritage/', '');
        setActiveSiteSlug(slug);
        setCurrentRoute('heritage-detail');
      } else if (hash.startsWith('knowledge-graph/')) {
        const slug = hash.replace('knowledge-graph/', '');
        setGraphTargetSlug(slug);
        setCurrentRoute('knowledge-graph');
      } else {
        if (hash === 'knowledge-graph') {
          // If plain knowledge-graph, don't force a specific target slug
        }
        setCurrentRoute(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (route: string, slug?: string) => {
    if (route === 'heritage-detail' && slug) {
      setActiveSiteSlug(slug);
      setCurrentRoute('heritage-detail');
      window.location.hash = `heritage/${slug}`;
    } else if (route === 'knowledge-graph') {
      setGraphTargetSlug(slug);
      setCurrentRoute('knowledge-graph');
      window.location.hash = slug ? `knowledge-graph/${slug}` : 'knowledge-graph';
    } else {
      setCurrentRoute(route);
      window.location.hash = route === 'home' ? '' : route;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'explore', label: 'Explore' },
    { id: 'quests', label: 'Quests' },
    { id: 'knowledge-graph', label: 'Knowledge Graph', badge: 'Step 8' },
    { id: 'research-assistant', label: 'Research Assistant', badge: 'AI' },
    { id: 'community', label: 'Community' },
    { id: 'contribute', label: 'Contribute' },
    { id: 'collection', label: 'My Collection' },
    { id: 'admin-import', label: 'Archive Import' }
  ];

  const featuredSites = SEED_HERITAGE_SITES.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#292821]">
      {/* Top Header Navigation */}
      <header className="border-b border-[#DCC9AD] bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <nav
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3"
          aria-label="Main Navigation"
        >
          <button
            onClick={() => navigateTo('home')}
            type="button"
            className="text-left focus:outline-hidden"
          >
            <Logo />
          </button>

          <ul className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
            {navItems.map(item => {
              const isActive = currentRoute === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigateTo(item.id)}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#B65F43] text-white font-semibold shadow-xs'
                        : 'text-[#292821] hover:text-[#B65F43] hover:bg-[#F8F5EF]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          isActive
                            ? 'bg-white text-[#B65F43]'
                            : 'bg-[#B65F43]/15 text-[#B65F43]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {/* Main Routed Content */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <div className="space-y-16 pb-16">
            {/* Hero Section */}
            <section className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 md:pt-16 md:grid-cols-2 md:items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B65F43]/10 text-[#B65F43] text-xs font-mono font-bold border border-[#B65F43]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Digital Cultural Revitalization
                </span>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.15] font-bold text-[#292821]">
                  Discover the Stories Hidden in India’s Heritage.
                </h1>

                <p className="text-base text-[#777267] leading-relaxed max-w-lg font-sans">
                  From scattered documents, colonial surveys, and forgotten stepwells to an interactive,
                  verifiable living knowledge graph.
                </p>

                {/* Search Bar */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    navigateTo('explore');
                  }}
                  className="flex items-center gap-2 max-w-md"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777267]" />
                    <input
                      type="text"
                      placeholder="Search monuments, patrons, or art..."
                      value={homeSearchInput}
                      onChange={e => setHomeSearchInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-[#DCC9AD] rounded-xl text-[#292821] focus:ring-2 focus:ring-[#B65F43] shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-xs shrink-0"
                  >
                    Search
                  </button>
                </form>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => navigateTo('knowledge-graph')}
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B65F43] hover:bg-[#9A4B32] text-white font-medium text-xs sm:text-sm rounded-xl transition-colors shadow-sm"
                  >
                    <Network className="w-4 h-4" />
                    <span>Explore Knowledge Graph (Step 8)</span>
                  </button>

                  <button
                    onClick={() => navigateTo('explore')}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#292821] hover:bg-[#F8F5EF] text-[#292821] font-medium text-xs sm:text-sm rounded-xl transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Interactive Map</span>
                  </button>
                </div>
              </div>

              {/* Hero Image Card */}
              <div className="relative">
                <figure className="bg-white p-3 rounded-2xl border border-[#DCC9AD] shadow-md space-y-2">
                  <img
                    src="https://images.unsplash.com/photo-1600100397608-f010f443b77a?q=80&w=1200&auto=format&fit=crop"
                    alt="Rani ki Vav Queen's Stepwell in Patan Gujarat"
                    className="aspect-4/3 sm:aspect-16/11 w-full rounded-xl object-cover"
                  />
                  <figcaption className="text-xs text-[#777267] flex items-center justify-between px-1">
                    <span>Rani ki Vav • UNESCO World Heritage Site (11th c. CE)</span>
                    <button
                      onClick={() => navigateTo('heritage-detail', 'rani-ki-vav')}
                      type="button"
                      className="text-[#B65F43] font-medium underline inline-flex items-center gap-1"
                    >
                      <span>View Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </figcaption>
                </figure>
              </div>
            </section>

            {/* Step 8 Heritage Knowledge Graph Feature Banner */}
            <section className="mx-auto max-w-6xl px-4">
              <div className="bg-gradient-to-r from-[#B65F43]/15 via-white to-[#667653]/15 border border-[#DCC9AD] rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#B65F43] bg-white px-2.5 py-0.5 rounded-full border border-[#DCC9AD] font-bold">
                      Step 8 Milestone Complete
                    </span>
                    <span className="text-[11px] font-mono text-[#667653] font-bold">
                      ✓ Evidence-Based Provenance
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#292821]">
                    Interactive Heritage Knowledge Graph
                  </h2>

                  <p className="text-sm text-[#777267] leading-relaxed">
                    Uncover historical lineages, architectural styles, patrons, and documents connected
                    to India’s monuments. Filter by entity types, review verbatim citations from the
                    Archaeological Survey of India (ASI) and UNESCO dossiers, or extract candidate relationships
                    directly from archival texts.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('knowledge-graph')}
                  type="button"
                  className="shrink-0 px-6 py-3 bg-[#B65F43] hover:bg-[#9A4B32] text-white font-medium text-sm rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                >
                  <Network className="w-4 h-4" />
                  <span>Launch Graph Explorer</span>
                </button>
              </div>
            </section>

            {/* Featured Heritage Highlights */}
            <section className="mx-auto max-w-6xl px-4 space-y-6" aria-labelledby="featured-heading">
              <div className="flex items-end justify-between border-b border-[#DCC9AD] pb-4">
                <div>
                  <h2 id="featured-heading" className="font-serif text-3xl font-bold text-[#292821]">
                    Featured Heritage Sites
                  </h2>
                  <p className="text-sm text-[#777267] mt-1">
                    Archival records ready for exploratory research and spatial navigation.
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('explore')}
                  type="button"
                  className="text-xs text-[#B65F43] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Explore all records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredSites.map(site => (
                  <article
                    key={site.id}
                    className="bg-white border border-[#DCC9AD] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#B65F43] transition-all shadow-2xs group"
                  >
                    <div>
                      {site.heritage_media && site.heritage_media[0] ? (
                        <img
                          src={site.heritage_media[0].url}
                          alt={site.name}
                          loading="lazy"
                          className="w-full aspect-16/10 object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full aspect-16/10 bg-[#FAF7F0] flex items-center justify-center text-xs text-[#777267]">
                          Archival Dossier
                        </div>
                      )}

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-[#777267]">
                          <span className="font-mono text-[10px] uppercase bg-[#B65F43]/10 text-[#B65F43] px-2 py-0.5 rounded font-medium">
                            {site.category}
                          </span>
                          <span>{site.period}</span>
                        </div>

                        <h3 className="font-serif text-lg font-bold text-[#292821] group-hover:text-[#B65F43] transition-colors">
                          <button
                            onClick={() => navigateTo('heritage-detail', site.slug)}
                            type="button"
                            className="text-left"
                          >
                            {site.name}
                          </button>
                        </h3>

                        <p className="text-xs text-[#777267]">
                          {site.district ? `${site.district}, ` : ''}
                          {site.state}
                        </p>

                        <p className="text-xs text-[#292821] line-clamp-2 leading-relaxed pt-1">
                          {site.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => navigateTo('heritage-detail', site.slug)}
                        type="button"
                        className="w-full py-2 bg-[#F8F5EF] hover:bg-[#B65F43] hover:text-white text-[#292821] text-xs font-medium rounded-lg transition-colors border border-[#DCC9AD]"
                      >
                        Inspect Dossier
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Explore View */}
        {currentRoute === 'explore' && (
          <ExploreView
            onNavigateToSite={slug => navigateTo('heritage-detail', slug)}
            onNavigateToContribute={() => navigateTo('contribute')}
          />
        )}

        {/* Quests View */}
        {currentRoute === 'quests' && (
          <QuestsView
            onNavigateToSite={slug => navigateTo('heritage-detail', slug)}
            onNavigateToGraph={slug => navigateTo('knowledge-graph', slug)}
          />
        )}

        {/* Knowledge Graph View (Step 8) */}
        {currentRoute === 'knowledge-graph' && (
          <KnowledgeGraphView
            initialEntities={SEED_HERITAGE_ENTITIES}
            initialRelationships={SEED_HERITAGE_RELATIONSHIPS}
            targetEntitySlug={graphTargetSlug}
            onNavigateToSite={slug => navigateTo('heritage-detail', slug)}
            onNavigateToContribute={() => navigateTo('contribute')}
          />
        )}

        {/* Community View */}
        {currentRoute === 'community' && (
          <CommunityView
            onNavigateToSite={slug => navigateTo('heritage-detail', slug)}
            onNavigateToContribute={() => navigateTo('contribute')}
          />
        )}

        {/* Contribute View */}
        {currentRoute === 'contribute' && (
          <ContributeView onSuccessReturn={() => navigateTo('explore')} />
        )}

        {/* Collection View */}
        {currentRoute === 'collection' && (
          <CollectionView
            onNavigateToSite={slug => navigateTo('heritage-detail', slug)}
            onNavigateToExplore={() => navigateTo('explore')}
          />
        )}

        {/* Heritage Site Detail View */}
        {currentRoute === 'heritage-detail' && (
          <HeritageDetailView
            slug={activeSiteSlug}
            onBack={() => navigateTo('explore')}
            onNavigateToGraph={slug => navigateTo('knowledge-graph', slug)}
          />
        )}

        {/* AI Heritage Research Assistant (Step 6) */}
        {currentRoute === 'research-assistant' && (
          <ResearchAssistantView
            onNavigateToGraph={slug => navigateTo('knowledge-graph', slug)}
            onNavigateToSite={slug => navigateTo('heritage-detail', slug)}
          />
        )}

        {/* Admin Batch Import View */}
        {currentRoute === 'admin-import' && <AdminImportView />}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#DCC9AD] bg-white px-4 py-8 text-center text-xs text-[#777267] space-y-2">
        <p className="font-serif text-sm text-[#292821] font-semibold">
          Every Place Has a Story. Every Story Deserves to Live.
        </p>
        <p className="max-w-md mx-auto text-[11px]">
          Virasat Quest is a digital initiative for the preservation and revitalization of unstructured cultural and architectural heritage archives.
        </p>
        <p className="text-[10px] font-mono text-[#B65F43] pt-1">
          Knowledge Graph Step 8 Verified • CC BY-SA 4.0 Open Cultural Data
        </p>
      </footer>
    </div>
  );
}
