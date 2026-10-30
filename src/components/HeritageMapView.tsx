/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Filter,
  RotateCcw,
  BookOpen,
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Compass,
  CheckCircle2,
  Calendar,
  Eye,
  Info,
} from 'lucide-react';
import type { DocumentRecord, DocumentType, VerificationStatus } from '../types/database.types';
import {
  MapFilters,
  MapLocationGroup,
  filterMapRecords,
  groupRecordsByLocation,
  computeMapBounds,
  formatCoordinateDisplay,
} from '../utils/heritageMap';
import { DocumentDetailModal } from './DocumentDetailModal';

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

interface HeritageMapViewProps {
  onNavigateToExplorer?: () => void;
  onNavigateToAssistant?: () => void;
  onNavigateToUpload?: () => void;
}

export const HeritageMapView: React.FC<HeritageMapViewProps> = ({
  onNavigateToExplorer,
  onNavigateToAssistant,
  onNavigateToUpload,
}) => {
  // Data State
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDocType, setFilterDocType] = useState<DocumentType | 'all'>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<VerificationStatus | 'all'>('all');
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [showUnmappedDrawer, setShowUnmappedDrawer] = useState<boolean>(false);

  // Modal State for inspecting folios
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectDoc, setInspectDoc] = useState<DocumentRecord | null>(null);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Fetch real document records
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to retrieve archive records.');
      }
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load heritage documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Compute dynamic filter options from real dataset
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.historical_period) set.add(d.historical_period);
    });
    return Array.from(set).sort();
  }, [documents]);

  // Apply filters and group records
  const { mappedRecords, unmappedRecords, locationGroups } = useMemo(() => {
    const { mapped, unmapped } = filterMapRecords(documents, {
      query: searchQuery,
      documentType: filterDocType,
      historicalPeriod: filterPeriod,
      verificationStatus: filterVerification,
    });
    const groups = groupRecordsByLocation(mapped);
    return {
      mappedRecords: mapped,
      unmappedRecords: unmapped,
      locationGroups: groups,
    };
  }, [documents, searchQuery, filterDocType, filterPeriod, filterVerification]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center on Western India / Gujarat heritage region [23.5, 72.5]
    const map = L.map(mapContainerRef.current, {
      center: [23.7, 72.2],
      zoom: 9,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap warm tile layer with attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &bull; Virasat Quest Archives',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers and bounds when locationGroups or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersMapRef.current.clear();

    if (locationGroups.length === 0) return;

    locationGroups.forEach((group) => {
      const isSelected = selectedGroupKey === group.key;
      const count = group.documents.length;

      // Custom styled SVG Pin matching Virasat Quest visual design
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }">
          <div class="flex items-center justify-center w-9 h-9 rounded-full shadow-md border-2 ${
            isSelected
              ? 'bg-[#16192E] border-[#B38E46] text-[#EDE5D5] ring-4 ring-[#B38E46]/30'
              : 'bg-[#F4EFE6] border-[#B38E46] text-[#B38E46]'
          }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 7.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="9" r="2.5" fill="currentColor" />
            </svg>
          </div>
          ${
            count > 1
              ? `<span class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B38E46] text-[9px] font-bold text-white shadow">
                  ${count}
                </span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'virasat-custom-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([group.latitude, group.longitude], { icon: customIcon });

      // Construct Popup Content with real metadata
      const popupDiv = document.createElement('div');
      popupDiv.className = 'font-sans text-[#18191E] p-1 min-w-[240px] max-w-[280px]';

      popupDiv.innerHTML = `
        <div class="border-b border-[#E2D7C3] pb-2 mb-2">
          <div class="flex items-center justify-between gap-1 text-[10px] text-[#B38E46] font-semibold uppercase tracking-wider">
            <span>${formatCoordinateDisplay(group.latitude, group.longitude)}</span>
            <span class="rounded bg-[#F4EFE6] px-1 py-0.2 border border-[#E2D7C3]">${count} ${
        count === 1 ? 'Record' : 'Records'
      }</span>
          </div>
          <h3 class="font-serif text-base font-bold text-[#16192E] mt-0.5">${escapeHtml(group.locationName)}</h3>
        </div>
        <div class="space-y-2 max-h-[180px] overflow-y-auto">
          ${group.documents
            .map(
              (doc, i) => `
            <div class="p-2 rounded border border-[#E2D7C3]/80 bg-[#FDFCF9] text-xs">
              <span class="inline-block px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded bg-[#F4EFE6] text-[#6B6860] border border-[#E2D7C3]/60 mb-1">
                ${escapeHtml(doc.document_type.replace('_', ' '))} &bull; ${escapeHtml(doc.historical_period || 'Period')}
              </span>
              <h4 class="font-serif font-bold text-[#16192E] line-clamp-1">${escapeHtml(doc.title)}</h4>
              <p class="text-[11px] text-[#6B6860] mt-0.5 line-clamp-2">${
                escapeHtml(doc.description || 'Verified archival document.')
              }</p>
              <button
                data-doc-id="${escapeHtml(doc.id)}"
                class="virasat-popup-inspect-btn mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#B38E46] hover:underline"
              >
                Inspect Folio &rarr;
              </button>
            </div>
          `
            )
            .join('')}
        </div>
      `;

      // Handle inspect click inside popup
      popupDiv.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.virasat-popup-inspect-btn');
        if (target) {
          const docId = target.getAttribute('data-doc-id');
          const found = group.documents.find((d) => d.id === docId);
          if (found) {
            setInspectDoc(found);
            setInspectModalOpen(true);
          }
        }
      });

      marker.bindPopup(popupDiv, { maxWidth: 300, className: 'virasat-leaflet-popup' });

      marker.on('click', () => {
        setSelectedGroupKey(group.key);
        marker.openPopup();
      });

      marker.addTo(layer);
      markersMapRef.current.set(group.key, marker);
    });

    // Auto-fit bounds if we have groups
    const bounds = computeMapBounds(locationGroups);
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [locationGroups]);

  // Center on selected group from sidebar
  const handleSelectGroup = (group: MapLocationGroup) => {
    setSelectedGroupKey(group.key);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([group.latitude, group.longitude], 12, { duration: 0.8 });
      const marker = markersMapRef.current.get(group.key);
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  };

  // Reset view to all groups
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDocType('all');
    setFilterPeriod('all');
    setFilterVerification('all');
    setSelectedGroupKey(null);
    const bounds = computeMapBounds(locationGroups);
    if (bounds && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-[#FBF9F4]">
      {/* Top Controls & Heritage Scope Banner */}
      <div className="border-b border-[#E2D7C3] bg-white px-4 py-4 sm:px-6 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#B38E46]/30 bg-[#F4EFE6] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#B38E46]">
                  <Compass className="h-3.5 w-3.5" />
                  Step 7: Interactive Heritage Map
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-[#2E7D32]/30 bg-[#E8F5E9] px-2 py-0.5 text-[11px] font-medium text-[#2E7D32]">
                  <CheckCircle2 className="h-3 w-3" />
                  Real Geospatial Coordinates
                </span>
              </div>
              <h1 className="mt-1.5 font-serif text-2xl font-bold tracking-tight text-[#16192E]">
                Geospatial Heritage Map
              </h1>
              <p className="text-xs text-[#6B6860]">
                Explore primary archival folios, colonial architectural surveys, and epigraphical charters by their verified geographic origin.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded border border-[#C9BBA2] bg-[#F4EFE6] px-3 py-1.5 text-xs font-medium text-[#6B6860] transition-colors hover:border-[#16192E] hover:text-[#16192E]"
                title="Reset search and filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset View
              </button>
              {onNavigateToExplorer && (
                <button
                  onClick={onNavigateToExplorer}
                  className="inline-flex items-center gap-1.5 rounded border border-[#C9BBA2] bg-[#F4EFE6] px-3 py-1.5 text-xs font-medium text-[#6B6860] transition-colors hover:border-[#16192E] hover:text-[#16192E]"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Archive Explorer
                </button>
              )}
            </div>
          </div>

          {/* Search & Metadata Filters Bar */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-3 border-t border-[#E2D7C3]/60">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C827A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search monuments, surveys, or locations (e.g. Patan, Modhera)..."
                className="w-full rounded-md border border-[#D5C9B3] bg-[#FDFCF9] pl-9 pr-3 py-1.5 text-xs text-[#16192E] placeholder-[#8C827A] focus:border-[#B38E46] focus:outline-none"
              />
            </div>

            {/* Document Type Filter */}
            <div>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value as any)}
                className="w-full rounded-md border border-[#D5C9B3] bg-[#FDFCF9] px-2.5 py-1.5 text-xs text-[#16192E] focus:border-[#B38E46] focus:outline-none"
              >
                <option value="all">All Document Types</option>
                <option value="architectural_record">Architectural Surveys</option>
                <option value="epigraphical_record">Epigraphical Charters</option>
                <option value="manuscript">Manuscripts</option>
                <option value="photograph">Photographs</option>
                <option value="map">Historical Maps</option>
              </select>
            </div>

            {/* Historical Period Filter */}
            <div>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full rounded-md border border-[#D5C9B3] bg-[#FDFCF9] px-2.5 py-1.5 text-xs text-[#16192E] focus:border-[#B38E46] focus:outline-none"
              >
                <option value="all">All Historical Eras</option>
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Status Filter */}
            <div>
              <select
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value as any)}
                className="w-full rounded-md border border-[#D5C9B3] bg-[#FDFCF9] px-2.5 py-1.5 text-xs text-[#16192E] focus:border-[#B38E46] focus:outline-none"
              >
                <option value="all">All Verification Statuses</option>
                <option value="peer_reviewed">Peer Reviewed / Verified</option>
                <option value="under_review">Under Review</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics & Unmapped Records Indicator */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B6860]">
            <div className="flex items-center gap-3">
              <span>
                <strong>{mappedRecords.length}</strong> georeferenced records across{' '}
                <strong>{locationGroups.length}</strong> location sites
              </span>
              <span>&bull;</span>
              <span>
                Tile Source: <strong>OpenStreetMap</strong>
              </span>
            </div>

            {unmappedRecords.length > 0 && (
              <button
                onClick={() => setShowUnmappedDrawer(!showUnmappedDrawer)}
                className="inline-flex items-center gap-1 font-semibold text-[#B38E46] hover:underline"
              >
                <Info className="h-3.5 w-3.5" />
                {unmappedRecords.length} unlocalized {unmappedRecords.length === 1 ? 'record' : 'records'}{' '}
                (no coordinates)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Map on left, Records Sidebar on right */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#FBF9F4]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-lg border border-[#E2D7C3] bg-white p-4 shadow-md">
              <Compass className="h-5 w-5 animate-spin text-[#B38E46]" />
              <span className="text-sm font-medium text-[#16192E]">
                Loading geographic archive records...
              </span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-[#FDEDEC] text-[#C0392B] text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </span>
            <button
              onClick={fetchDocuments}
              className="font-bold underline hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* Map Canvas (2/3 width on desktop) */}
        <div className="flex-1 h-[420px] lg:h-auto min-h-[420px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-20 rounded-md border border-[#E2D7C3] bg-white/95 px-3 py-2 text-[11px] text-[#6B6860] shadow-md backdrop-blur-md hidden sm:block">
            <span className="font-semibold text-[#16192E] block mb-1">Map Legend</span>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B38E46]" />
              <span>Verified Heritage Site</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16192E]" />
              <span>Selected Site</span>
            </div>
          </div>
        </div>

        {/* Archival Records Sidebar (1/3 width on desktop) */}
        <div className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-[#E2D7C3] bg-[#FDFCF9] flex flex-col max-h-[600px] lg:max-h-none overflow-hidden">
          <div className="p-3 border-b border-[#E2D7C3] bg-[#F4EFE6]/60 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#B38E46]" />
              Geographic Sites ({locationGroups.length})
            </span>
            <span className="text-[11px] text-[#6B6860]">
              Click a site to fly to coordinates
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {locationGroups.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin className="mx-auto h-8 w-8 text-[#C9BBA2] mb-2" />
                <h4 className="font-serif text-sm font-bold text-[#16192E]">
                  No Mapped Heritage Records Found
                </h4>
                <p className="mt-1 text-xs text-[#6B6860]">
                  No archival records match the current filter criteria with verified geographic coordinates.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-3 inline-flex items-center gap-1 rounded border border-[#C9BBA2] bg-[#F4EFE6] px-3 py-1 text-xs font-medium text-[#16192E] hover:border-[#B38E46]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filters
                </button>
              </div>
            ) : (
              locationGroups.map((group) => {
                const isSelected = selectedGroupKey === group.key;
                return (
                  <div
                    key={group.key}
                    onClick={() => handleSelectGroup(group)}
                    className={`cursor-pointer rounded-lg border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-[#B38E46] bg-[#F4EFE6] ring-1 ring-[#B38E46]'
                        : 'border-[#E2D7C3] bg-white hover:border-[#B38E46] hover:bg-[#FDFCF9]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B38E46]">
                          {formatCoordinateDisplay(group.latitude, group.longitude)}
                        </span>
                        <h3 className="font-serif text-sm font-bold text-[#16192E]">
                          {group.locationName}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded bg-[#F4EFE6] px-2 py-0.5 text-[10px] font-bold text-[#6B6860] border border-[#E2D7C3]">
                        {group.documents.length}{' '}
                        {group.documents.length === 1 ? 'Folio' : 'Folios'}
                      </span>
                    </div>

                    {/* Document Previews in this Location */}
                    <div className="mt-2.5 pt-2 border-t border-[#EAE3D2] space-y-2">
                      {group.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded border border-[#E2D7C3]/60 bg-[#FDFCF9] p-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-semibold text-[#8C827A] uppercase">
                              {doc.historical_period || 'Period'}
                            </span>
                            <span className="text-[10px] text-[#2E7D32] font-medium">
                              {doc.verification_status.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-[#16192E] line-clamp-1 mt-0.5">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-[#6B6860] line-clamp-2 mt-0.5">
                            {doc.description || 'Verified archival record.'}
                          </p>
                          <div className="mt-2 pt-1 border-t border-[#EAE3D2]/40 flex items-center justify-between">
                            <span className="text-[10px] text-[#8C827A]">
                              {doc.attribution || doc.source_name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectDoc(doc);
                                setInspectModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B38E46] hover:underline"
                            >
                              Inspect Folio <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Unmapped Records Drawer Toggle */}
          {unmappedRecords.length > 0 && showUnmappedDrawer && (
            <div className="border-t border-[#E2D7C3] bg-[#F4EFE6] p-3 max-h-[200px] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#16192E] flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[#B38E46]" />
                  Unlocalized Archival Records ({unmappedRecords.length})
                </span>
                <button
                  onClick={() => setShowUnmappedDrawer(false)}
                  className="text-xs font-bold text-[#6B6860] hover:text-[#16192E]"
                >
                  &times;
                </button>
              </div>
              <p className="text-[11px] text-[#6B6860] mb-2">
                These records do not possess verified geographic coordinates. In accordance with archival fidelity, they are not plotted on the map.
              </p>
              <div className="space-y-1.5">
                {unmappedRecords.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded bg-white border border-[#E2D7C3] text-xs"
                  >
                    <div>
                      <h5 className="font-serif font-bold text-[#16192E] line-clamp-1">
                        {doc.title}
                      </h5>
                      <span className="text-[10px] text-[#8C827A]">
                        {doc.historical_period} &bull; {doc.location_name || 'Manuscript Collection'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setInspectDoc(doc);
                        setInspectModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-[#B38E46] hover:underline shrink-0 ml-2"
                    >
                      Inspect &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Reader Modal */}
      {inspectModalOpen && inspectDoc && (
        <DocumentDetailModal
          document={inspectDoc}
          onClose={() => setInspectModalOpen(false)}
        />
      )}
    </div>
  );
};
