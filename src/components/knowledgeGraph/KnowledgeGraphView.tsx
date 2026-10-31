import React, { useState, useMemo, useEffect } from 'react';
import {
  HeritageEntity,
  HeritageRelationship,
  GraphFilterState,
  EntityType,
  RelationshipType
} from '../../types/knowledgeGraph';
import { filterGraph, searchEntities } from '../../utils/graphLogic';
import { InteractiveGraphCanvas } from './InteractiveGraphCanvas';
import { GraphFilterBar } from './GraphFilterBar';
import { GraphLegend } from './GraphLegend';
import { GraphControls } from './GraphControls';
import { EntityDetailsPanel } from './EntityDetailsPanel';
import { RelationshipDetailsPanel } from './RelationshipDetailsPanel';
import { GraphListView } from './GraphListView';
import { ArchivalExtractionModal } from './ArchivalExtractionModal';
import {
  Network,
  List,
  Sparkles,
  Info,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  FileText
} from 'lucide-react';

interface KnowledgeGraphViewProps {
  initialEntities: HeritageEntity[];
  initialRelationships: HeritageRelationship[];
  targetEntitySlug?: string;
  onNavigateToSite?: (slug: string) => void;
  onNavigateToContribute?: () => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  initialEntities,
  initialRelationships,
  targetEntitySlug,
  onNavigateToSite,
  onNavigateToContribute
}) => {
  const [entities, setEntities] = useState<HeritageEntity[]>(initialEntities);
  const [relationships, setRelationships] = useState<HeritageRelationship[]>(initialRelationships);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode: 'canvas' | 'list'
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  // Filter state
  const [filters, setFilters] = useState<GraphFilterState>({
    searchQuery: '',
    selectedEntityTypes: [],
    selectedRelationshipTypes: [],
    verificationFilter: 'all'
  });

  // Selection states
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  // Canvas viewport states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSimulating, setIsSimulating] = useState(true);

  // Archival extraction modal
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);

  // 1. Search entities
  const searchMatchedEntities = useMemo(() => {
    return searchEntities(entities, filters.searchQuery);
  }, [entities, filters.searchQuery]);

  // 2. Filter graph by type and verification
  const { filteredEntities, filteredRelationships } = useMemo(() => {
    return filterGraph(searchMatchedEntities, relationships, filters);
  }, [searchMatchedEntities, relationships, filters]);

  // Entity counts by type for legend
  const entityCounts = useMemo(() => {
    const counts: Partial<Record<EntityType, number>> = {};
    for (const ent of entities) {
      counts[ent.entityType] = (counts[ent.entityType] || 0) + 1;
    }
    return counts;
  }, [entities]);

  // Handle toggling an entity type from legend or filter bar
  const handleToggleEntityType = (type: EntityType) => {
    const current = filters.selectedEntityTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];

    setFilters({
      ...filters,
      selectedEntityTypes: next
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedEntityTypes: [],
      selectedRelationshipTypes: [],
      verificationFilter: 'all'
    });
    setSelectedEntityId(null);
    setSelectedRelationshipId(null);
  };

  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    setSelectedRelationshipId(null);
  };

  const handleSelectRelationship = (relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
    setSelectedEntityId(null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev * 0.8, 0.4));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedEntityId(null);
    setSelectedRelationshipId(null);
  };

  const handleFitView = () => {
    setZoom(0.9);
    setPan({ x: 0, y: 0 });
  };

  // Pre-select target entity when requested from navigation
  useEffect(() => {
    if (targetEntitySlug) {
      const match = entities.find(e => e.slug === targetEntitySlug);
      if (match) {
        setSelectedEntityId(match.id);
        setSelectedRelationshipId(null);
      }
    }
  }, [targetEntitySlug, entities]);

  // Add newly extracted entities and relationships
  const handleAddEntitiesAndRelationships = (
    newEntities: HeritageEntity[],
    newRelationships: HeritageRelationship[]
  ) => {
    // Avoid duplicate entities by slug
    const existingSlugs = new Set(entities.map(e => e.slug));
    const toAddEnts = newEntities.filter(e => !existingSlugs.has(e.slug));

    // Avoid duplicate relationships
    const existingRelKeys = new Set(
      relationships.map(r => `${r.sourceEntityId}_${r.targetEntityId}_${r.relationshipType}`)
    );
    const toAddRels = newRelationships.filter(
      r => !existingRelKeys.has(`${r.sourceEntityId}_${r.targetEntityId}_${r.relationshipType}`)
    );

    setEntities(prev => [...prev, ...toAddEnts]);
    setRelationships(prev => [...prev, ...toAddRels]);
  };

  const handleExportJson = () => {
    const data = {
      project: 'Virasat  Heritage Knowledge Graph',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entities,
      relationships
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virasat-quest-knowledge-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedEntity = useMemo(() => {
    return entities.find(e => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  const selectedRelationship = useMemo(() => {
    return relationships.find(r => r.id === selectedRelationshipId) || null;
  }, [relationships, selectedRelationshipId]);

  // Statistics
  const verifiedRelationsCount = relationships.filter(r => r.verificationStatus === 'verified').length;
  const primarySourcesCount = relationships.filter(r =>
    ['primary_source', 'epigraphic_record'].includes(r.evidenceClassification)
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCC9AD] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono uppercase tracking-wider text-[#B65F43] font-bold">
            <Network className="w-4 h-4" />
            <span>Step 8 • Cultural Knowledge Graph</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#292821]">
            Heritage Knowledge Graph
          </h1>

          <p className="mt-2 text-sm text-[#777267] max-w-3xl leading-relaxed">
            Explore the interconnected cultural, architectural, and genealogical landscape of India’s
            heritage archives. Every connection is backed by verbatim archival citations, inscriptions,
            and archaeological monographs.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div
          className="inline-flex rounded-lg border border-[#DCC9AD] p-1 bg-white shadow-xs self-start md:self-end"
          role="tablist"
          aria-label="View representation mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'canvas'}
            onClick={() => setViewMode('canvas')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'canvas'
                ? 'bg-[#B65F43] text-white shadow-xs'
                : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Graph</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-[#B65F43] text-white shadow-xs'
                : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Archive Catalogue</span>
          </button>
        </div>
      </div>

      {/* Live Archival Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-[#DCC9AD] rounded-xl shadow-2xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#777267]">
            Archival Entities
          </p>
          <p className="font-serif text-2xl font-bold text-[#292821] mt-0.5">{entities.length}</p>
        </div>

        <div className="p-3 bg-white border border-[#DCC9AD] rounded-xl shadow-2xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#777267]">
            Documented Relations
          </p>
          <p className="font-serif text-2xl font-bold text-[#B65F43] mt-0.5">{relationships.length}</p>
        </div>

        <div className="p-3 bg-white border border-[#DCC9AD] rounded-xl shadow-2xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#777267]">
            In Situ Epigraphs
          </p>
          <p className="font-serif text-2xl font-bold text-[#667653] mt-0.5">{primarySourcesCount}</p>
        </div>

        <div className="p-3 bg-white border border-[#DCC9AD] rounded-xl shadow-2xs">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#777267]">
            Verified Citations
          </p>
          <p className="font-serif text-2xl font-bold text-[#C27803] mt-0.5">{verifiedRelationsCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GraphFilterBar
        filterState={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalFilteredNodes={filteredEntities.length}
        totalFilteredEdges={filteredRelationships.length}
        onOpenExtractor={() => setIsExtractorOpen(true)}
      />

      {/* Graph Legend */}
      <div className="bg-white/70 border border-[#DCC9AD] p-3 rounded-xl shadow-2xs">
        <GraphLegend
          counts={entityCounts}
          selectedTypes={filters.selectedEntityTypes}
          onToggleType={handleToggleEntityType}
        />
      </div>

      {/* Main Graph Content Area */}
      {viewMode === 'canvas' ? (
        <div className="relative w-full h-[620px] rounded-2xl border border-[#DCC9AD] shadow-md overflow-hidden bg-[#F8F5EF]">
          {filteredEntities.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#B65F43]/15 text-[#B65F43] flex items-center justify-center">
                <Info className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#292821]">
                No archival records match your criteria.
              </h3>
              <p className="text-sm text-[#777267] max-w-md">
                Try widening your search terms, selecting additional entity types, or clearing the
                current filters to explore the full graph.
              </p>
              <button
                onClick={handleResetFilters}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B65F43] hover:bg-[#9A4B32] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* Interactive Graph Canvas */}
              <InteractiveGraphCanvas
                entities={filteredEntities}
                relationships={filteredRelationships}
                selectedEntityId={selectedEntityId}
                selectedRelationshipId={selectedRelationshipId}
                searchQuery={filters.searchQuery}
                onSelectEntity={handleSelectEntity}
                onSelectRelationship={handleSelectRelationship}
                onClearSelection={() => {
                  setSelectedEntityId(null);
                  setSelectedRelationshipId(null);
                }}
                isSimulating={isSimulating}
                zoom={zoom}
                pan={pan}
                onZoomChange={setZoom}
                onPanChange={setPan}
              />

              {/* Floating Graph Controls */}
              <GraphControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetView={handleResetView}
                onFitView={handleFitView}
                isSimulating={isSimulating}
                onToggleSimulation={() => setIsSimulating(prev => !prev)}
                onExportJson={handleExportJson}
                currentZoom={zoom}
              />

              {/* Selected Entity Details Panel */}
              {selectedEntity && (
                <EntityDetailsPanel
                  entity={selectedEntity}
                  relationships={relationships}
                  allEntities={entities}
                  onClose={() => setSelectedEntityId(null)}
                  onSelectEntity={handleSelectEntity}
                  onSelectRelationship={handleSelectRelationship}
                  onNavigateToSite={onNavigateToSite}
                />
              )}

              {/* Selected Relationship Details Panel */}
              {selectedRelationship && (
                <RelationshipDetailsPanel
                  relationship={selectedRelationship}
                  entities={entities}
                  onClose={() => setSelectedRelationshipId(null)}
                  onSelectEntity={handleSelectEntity}
                  onNavigateToSite={onNavigateToSite}
                />
              )}
            </>
          )}
        </div>
      ) : (
        /* Accessible Table / List View */
        <GraphListView
          entities={filteredEntities}
          relationships={filteredRelationships}
          onSelectEntity={handleSelectEntity}
          onSelectRelationship={handleSelectRelationship}
          onNavigateToSite={onNavigateToSite}
        />
      )}

      {/* Archival Extraction Modal */}
      <ArchivalExtractionModal
        isOpen={isExtractorOpen}
        onClose={() => setIsExtractorOpen(false)}
        existingEntities={entities}
        existingRelationships={relationships}
        onAddEntitiesAndRelationships={handleAddEntitiesAndRelationships}
      />
    </div>
  );
};
