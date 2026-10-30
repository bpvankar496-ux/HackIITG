import React from 'react';
import { Search, X, Filter, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { EntityType, RelationshipType, GraphFilterState } from '../../types/knowledgeGraph';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  commissioned_by: 'Commissioned By',
  built_by: 'Built By',
  patronized_by: 'Patronized By',
  located_in: 'Located In',
  originated_during: 'Originated During',
  associated_event: 'Associated Event',
  architectural_tradition: 'Architectural Tradition',
  documented_in: 'Documented In',
  successor_of: 'Successor Of',
  dedicated_to: 'Dedicated To',
  restored_by: 'Restored By',
  material_used: 'Material Used',
  inscribed_by: 'Inscribed By'
};

interface GraphFilterBarProps {
  filterState: GraphFilterState;
  onFilterChange: (newState: GraphFilterState) => void;
  onResetFilters: () => void;
  totalFilteredNodes: number;
  totalFilteredEdges: number;
  onOpenExtractor: () => void;
}

export const GraphFilterBar: React.FC<GraphFilterBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  totalFilteredNodes,
  totalFilteredEdges,
  onOpenExtractor
}) => {
  const hasActiveFilters =
    filterState.searchQuery.trim().length > 0 ||
    filterState.selectedEntityTypes.length > 0 ||
    filterState.selectedRelationshipTypes.length > 0 ||
    filterState.verificationFilter !== 'all';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterState,
      searchQuery: e.target.value
    });
  };

  const handleRelationshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as RelationshipType | '';
    onFilterChange({
      ...filterState,
      selectedRelationshipTypes: val ? [val] : []
    });
  };

  const handleVerificationChange = (status: 'all' | 'verified' | 'pending') => {
    onFilterChange({
      ...filterState,
      verificationFilter: status
    });
  };

  return (
    <div className="bg-white border border-[#DCC9AD] p-4 rounded-xl shadow-xs space-y-3">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777267]" />
          <input
            type="text"
            value={filterState.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search entities, historical figures, places, or aliases (e.g. Rani Udayamati)..."
            aria-label="Search entities in knowledge graph"
            className="w-full pl-9 pr-8 py-2 text-sm bg-[#F8F5EF]/60 border border-[#DCC9AD] rounded-lg text-[#292821] placeholder-[#777267] focus:outline-hidden focus:ring-2 focus:ring-[#B65F43] focus:border-transparent transition-all"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filterState, searchQuery: '' })}
              type="button"
              title="Clear search query"
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#777267] hover:text-[#292821]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Relationship Type Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={filterState.selectedRelationshipTypes[0] || ''}
            onChange={handleRelationshipChange}
            aria-label="Filter by relationship type"
            className="px-3 py-2 text-sm bg-[#F8F5EF]/60 border border-[#DCC9AD] rounded-lg text-[#292821] focus:outline-hidden focus:ring-2 focus:ring-[#B65F43]"
          >
            <option value="">All Relationships</option>
            {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Filter Pills */}
        <div
          className="inline-flex rounded-lg border border-[#DCC9AD] p-0.5 bg-[#F8F5EF]"
          role="group"
          aria-label="Filter by archival verification status"
        >
          <button
            type="button"
            onClick={() => handleVerificationChange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterState.verificationFilter === 'all'
                ? 'bg-white text-[#292821] shadow-xs'
                : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleVerificationChange('verified')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterState.verificationFilter === 'verified'
                ? 'bg-[#667653] text-white shadow-xs'
                : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </button>
          <button
            type="button"
            onClick={() => handleVerificationChange('pending')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterState.verificationFilter === 'pending'
                ? 'bg-[#C27803] text-white shadow-xs'
                : 'text-[#777267] hover:text-[#292821]'
            }`}
          >
            <Clock className="w-3 h-3" />
            Pending Review
          </button>
        </div>

        {/* Open Extractor Button */}
        <button
          onClick={onOpenExtractor}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-[#B65F43] hover:bg-[#9A4B32] text-white rounded-lg transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Extract from Text</span>
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-[#B65F43] hover:bg-[#B65F43]/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {/* Results Live Count */}
      <div className="flex items-center justify-between text-xs text-[#777267] pt-1 border-t border-[#DCC9AD]/40">
        <p aria-live="polite">
          Showing <strong className="text-[#292821]">{totalFilteredNodes}</strong> entities and{' '}
          <strong className="text-[#292821]">{totalFilteredEdges}</strong> archival relationships
          {filterState.searchQuery && ` matching "${filterState.searchQuery}"`}
        </p>

        <span className="text-[11px] font-mono text-[#777267]">
          Parchment Archival Graph v1.0
        </span>
      </div>
    </div>
  );
};
