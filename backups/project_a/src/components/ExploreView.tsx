import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SEED_HERITAGE_SITES, HeritageSiteItem } from '../data/seedHeritageSites';
import { VALID_HERITAGE_CATEGORIES } from '../utils/heritageDataImporter';
import { Search, Map as MapIcon, List, Filter, ExternalLink, X, MapPin, Award, ShieldCheck, Compass, Sparkles } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ExploreViewProps {
  onNavigateToSite: (slug: string) => void;
  onNavigateToContribute: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onNavigateToSite,
  onNavigateToContribute
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedUnesco, setSelectedUnesco] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [activeSite, setActiveSite] = useState<HeritageSiteItem | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Unique sorted list of states
  const availableStates = useMemo(() => {
    const states = Array.from(new Set(SEED_HERITAGE_SITES.map(s => s.state))).sort();
    return states;
  }, []);

  // Filter sites
  const filteredSites = useMemo(() => {
    return SEED_HERITAGE_SITES.filter(site => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = site.name.toLowerCase().includes(q);
        const matchAlt = site.alternateNames?.some(a => a.toLowerCase().includes(q));
        const matchDesc = site.description.toLowerCase().includes(q);
        const matchState = site.state.toLowerCase().includes(q);
        const matchDistrict = site.district?.toLowerCase().includes(q);
        const matchLocality = site.locality?.toLowerCase().includes(q);
        const matchStyle = site.architecturalStyle?.toLowerCase().includes(q);
        const matchPeriod = site.period?.toLowerCase().includes(q);
        const matchSource = site.source.toLowerCase().includes(q);

        if (!matchName && !matchAlt && !matchDesc && !matchState && !matchDistrict && !matchLocality && !matchStyle && !matchPeriod && !matchSource) {
          return false;
        }
      }

      if (selectedCategory && site.category !== selectedCategory) return false;
      if (selectedState && site.state.toLowerCase() !== selectedState.toLowerCase()) return false;
      if (selectedUnesco) {
        if (selectedUnesco === 'WHS' && site.unescoStatus !== 'World Heritage Site') return false;
        if (selectedUnesco === 'Tentative' && site.unescoStatus !== 'Tentative List') return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedState, selectedUnesco]);

  // Overall collection stats
  const totalSites = SEED_HERITAGE_SITES.length;
  const unescoCount = SEED_HERITAGE_SITES.filter(s => s.unescoStatus === 'World Heritage Site').length;
  const asiCount = SEED_HERITAGE_SITES.filter(s => s.protectionCategory === 'ASI National').length;
  const gujaratCount = SEED_HERITAGE_SITES.filter(s => s.state === 'Gujarat').length;

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 78.5], // Center of India
        zoom: 5,
        scrollWheelZoom: true
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Distinct styles for markers
    const createMarkerIcon = (site: HeritageSiteItem, isActive: boolean) => {
      const isUnesco = site.unescoStatus === 'World Heritage Site';
      const bgColor = isUnesco ? '#B65F43' : '#667653';
      const size = isActive ? 24 : isUnesco ? 18 : 16;
      const border = isActive ? '3px solid #ffffff' : '2px solid #ffffff';
      const shadow = isActive ? 'box-shadow: 0 0 10px rgba(182,95,67,0.7);' : 'box-shadow: 0 1px 4px rgba(0,0,0,0.3);';

      return L.divIcon({
        className: 'custom-heritage-pin',
        html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${bgColor};border:${border};${shadow}"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    };

    filteredSites.forEach(site => {
      if (site.lat != null && site.lng != null) {
        const isActive = activeSite?.id === site.id;
        const marker = L.marker([site.lat, site.lng], {
          icon: createMarkerIcon(site, isActive),
          title: site.name
        }).addTo(map);

        marker.on('click', () => {
          setActiveSite(site);
        });

        markersRef.current.push(marker);
      }
    });

    return () => {
      // Keep map instance mounted
    };
  }, [viewMode, filteredSites, activeSite]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCC9AD] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#B65F43] bg-white px-2.5 py-0.5 rounded-full border border-[#DCC9AD] font-bold">
              Step 10 Authentic Heritage Archive
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821]">
            Explore India’s Heritage Archive
          </h1>
          <p className="mt-1.5 text-sm text-[#777267] max-w-2xl">
            Locate and explore authentic archaeological landmarks, subterranean stepwells, hill fortresses, and sacred architecture verified from UNESCO dossiers and Archaeological Survey of India surveys.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-lg border border-[#DCC9AD] p-1 bg-white shadow-xs self-start md:self-end">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'map' ? 'bg-[#B65F43] text-white' : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'list' ? 'bg-[#B65F43] text-white' : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Dataset Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#DCC9AD] p-3 rounded-xl shadow-2xs">
          <div className="text-[11px] text-[#777267] font-medium">Total Heritage Records</div>
          <div className="text-xl font-serif font-bold text-[#292821] mt-0.5">{totalSites} Verified</div>
        </div>
        <div className="bg-white border border-[#DCC9AD] p-3 rounded-xl shadow-2xs">
          <div className="text-[11px] text-[#777267] font-medium">UNESCO World Heritage</div>
          <div className="text-xl font-serif font-bold text-[#B65F43] mt-0.5">{unescoCount} Inscribed</div>
        </div>
        <div className="bg-white border border-[#DCC9AD] p-3 rounded-xl shadow-2xs">
          <div className="text-[11px] text-[#777267] font-medium">ASI National Monuments</div>
          <div className="text-xl font-serif font-bold text-[#667653] mt-0.5">{asiCount} Protected</div>
        </div>
        <div className="bg-white border border-[#DCC9AD] p-3 rounded-xl shadow-2xs">
          <div className="text-[11px] text-[#777267] font-medium">Gujarat Heritage Corpus</div>
          <div className="text-xl font-serif font-bold text-[#292821] mt-0.5">{gujaratCount} Sites</div>
        </div>
      </div>

      {/* Quick State Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono text-[#777267] shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#B65F43]" />
          Filter State:
        </span>
        <button
          type="button"
          onClick={() => setSelectedState('')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
            selectedState === '' ? 'bg-[#292821] text-white' : 'bg-white border border-[#DCC9AD] text-[#777267] hover:text-[#292821]'
          }`}
        >
          All States ({totalSites})
        </button>
        {availableStates.map(state => {
          const count = SEED_HERITAGE_SITES.filter(s => s.state === state).length;
          return (
            <button
              key={state}
              type="button"
              onClick={() => setSelectedState(selectedState === state ? '' : state)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedState === state
                  ? 'bg-[#B65F43] text-white font-bold'
                  : 'bg-white border border-[#DCC9AD] text-[#777267] hover:text-[#292821]'
              }`}
            >
              {state} ({count})
            </button>
          );
        })}
      </div>

      {/* Multi-facet Filter Bar */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 bg-white p-4 rounded-xl border border-[#DCC9AD] shadow-xs">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777267]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search monuments, patrons, styles, or districts..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
          >
            <option value="">All Categories</option>
            {VALID_HERITAGE_CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
          >
            <option value="">All Regions / States</option>
            {availableStates.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedUnesco}
            onChange={e => setSelectedUnesco(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F8F5EF] border border-[#DCC9AD] rounded-lg text-[#292821] focus:ring-2 focus:ring-[#B65F43]"
          >
            <option value="">All Designations</option>
            <option value="WHS">UNESCO World Heritage</option>
            <option value="Tentative">UNESCO Tentative List</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#777267]">
        <p aria-live="polite">
          Showing <strong className="text-[#292821]">{filteredSites.length}</strong> of {totalSites} authentic heritage records
        </p>
        {(searchQuery || selectedCategory || selectedState || selectedUnesco) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('');
              setSelectedState('');
              setSelectedUnesco('');
            }}
            type="button"
            className="text-[#B65F43] hover:underline font-medium"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Main Content */}
      {filteredSites.length === 0 ? (
        <div className="p-8 border border-[#DCC9AD] rounded-xl text-center space-y-3 bg-white">
          <p className="font-serif text-xl font-bold text-[#292821]">No heritage records match your criteria.</p>
          <p className="text-sm text-[#777267]">
            Try adjusting your query, or{' '}
            <button
              onClick={onNavigateToContribute}
              type="button"
              className="text-[#B65F43] underline font-medium"
            >
              propose this archival site to the community repository
            </button>
            .
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="relative border border-[#DCC9AD] rounded-xl overflow-hidden shadow-sm h-[540px]">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Legend */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-[#DCC9AD] text-[11px] text-[#292821] shadow-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B65F43] border border-white" />
              <span>UNESCO World Heritage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#667653] border border-white" />
              <span>National & State Protected</span>
            </div>
          </div>

          {/* Active Site Bottom Drawer on Map */}
          {activeSite && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[#DCC9AD] shadow-lg max-w-xl mx-auto flex items-start justify-between gap-4 animate-in slide-in-from-bottom duration-150">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase bg-[#B65F43]/15 text-[#B65F43] px-2 py-0.5 rounded font-bold">
                    {activeSite.category}
                  </span>
                  {activeSite.unescoStatus === 'World Heritage Site' && (
                    <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      UNESCO WHS ({activeSite.designationYear})
                    </span>
                  )}
                  {activeSite.protectionCategory && (
                    <span className="text-[10px] font-mono text-[#667653] bg-[#667653]/10 px-2 py-0.5 rounded">
                      {activeSite.protectionCategory}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-lg font-bold text-[#292821] leading-tight">
                  {activeSite.name}
                </h3>

                <p className="text-xs text-[#777267] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B65F43]" />
                  <span>
                    {activeSite.district ? `${activeSite.district}, ` : ''}
                    {activeSite.state}
                  </span>
                  {activeSite.period && <span>• {activeSite.period}</span>}
                </p>

                <p className="text-xs text-[#292821] line-clamp-2 leading-relaxed">
                  {activeSite.description}
                </p>

                <div className="pt-1.5 flex items-center gap-3">
                  <button
                    onClick={() => onNavigateToSite(activeSite.slug)}
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-[#B65F43] font-bold hover:underline"
                  >
                    <span>Inspect Complete Archival Record</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  {activeSite.sourceOrganization && (
                    <span className="text-[10px] text-[#777267] font-mono">
                      Source: {activeSite.sourceOrganization}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveSite(null)}
                type="button"
                className="p-1 text-[#777267] hover:text-[#292821]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map(site => (
            <article
              key={site.id}
              className="bg-white border border-[#DCC9AD] rounded-xl p-4 flex flex-col justify-between hover:border-[#B65F43] transition-all shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="font-mono text-[10px] uppercase bg-[#B65F43]/10 text-[#B65F43] px-2 py-0.5 rounded font-medium">
                    {site.category}
                  </span>
                  {site.unescoStatus === 'World Heritage Site' ? (
                    <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      WHS {site.designationYear ? `'${String(site.designationYear).slice(-2)}` : ''}
                    </span>
                  ) : site.unescoStatus === 'Tentative List' ? (
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Tentative List
                    </span>
                  ) : null}
                </div>

                <h3 className="font-serif text-lg font-bold text-[#292821]">
                  <button
                    onClick={() => onNavigateToSite(site.slug)}
                    type="button"
                    className="hover:text-[#B65F43] text-left underline"
                  >
                    {site.name}
                  </button>
                </h3>

                {site.alternateNames && site.alternateNames.length > 0 && (
                  <p className="text-[11px] text-[#777267] italic truncate">
                    Also known as: {site.alternateNames.join(', ')}
                  </p>
                )}

                <p className="text-xs text-[#777267] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B65F43] shrink-0" />
                  <span className="truncate">
                    {site.district ? `${site.district}, ` : ''}
                    {site.state}
                  </span>
                </p>

                {site.architecturalStyle && (
                  <p className="text-[11px] text-[#667653] font-mono">
                    Style: {site.architecturalStyle}
                  </p>
                )}

                <p className="text-xs text-[#292821] line-clamp-3 leading-relaxed">
                  {site.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#DCC9AD]/40 flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#667653] font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {site.verification === 'verified' ? 'Verified Source' : 'Community Archive'}
                </span>

                <button
                  onClick={() => onNavigateToSite(site.slug)}
                  type="button"
                  className="text-[#B65F43] font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreView;
