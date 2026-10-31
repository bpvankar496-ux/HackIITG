/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  FileText,
  RefreshCw,
  AlertCircle,
  Plus,
  Eye,
  Calendar,
  MapPin,
  HardDrive,
  ShieldCheck,
  Search,
  X,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { DocumentRecord, DocumentType, VerificationStatus } from '../types/database.types';
import { formatBytes } from '../utils/uploadValidation';
import {
  ArchivePassageResult,
  SearchFilters,
  highlightMatchingSegments,
} from '../utils/archiveSearch';
import { DocumentDetailModal } from './DocumentDetailModal';
import { getAuthHeaders } from '../lib/supabase';

const SEARCH_PAGE_SIZE = 30;

interface ArchiveExplorerViewProps {
  onNavigateToUpload: () => void;
}

export const ArchiveExplorerView: React.FC<ArchiveExplorerViewProps> = ({
  onNavigateToUpload,
}) => {
  // Navigation & Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [targetPageNum, setTargetPageNum] = useState<number>(1);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterVerification, setFilterVerification] = useState<VerificationStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'passages' | 'documents'>('passages');

  // Data State
  const [searchResults, setSearchResults] = useState<ArchivePassageResult[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [searchExecutionMs, setSearchExecutionMs] = useState<number>(0);
  const [searchSource, setSearchSource] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMorePassages, setHasMorePassages] = useState<boolean>(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [archiveWarning, setArchiveWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic filter options extracted from dataset
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Execute full-text search
  const executeSearch = async (
    query: string = activeQuery,
    type: DocumentType | 'all' = filterType,
    period: string = filterPeriod,
    location: string = filterLocation,
    verification: VerificationStatus | 'all' = filterVerification,
    offset: number = 0,
    append: boolean = false
  ) => {
    if (append) {
      setLoadingMore(true);
      setPaginationError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (type !== 'all') params.set('type', type);
      if (period !== 'all') params.set('period', period);
      if (location !== 'all') params.set('location', location);
      if (verification !== 'all') params.set('verification', verification);
      params.set('limit', String(SEARCH_PAGE_SIZE));
      params.set('offset', String(offset));

      const res = await fetch(`/api/archive/search?${params.toString()}`, {
        headers: await getAuthHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to search archival records.');
      }

      const results: ArchivePassageResult[] = Array.isArray(data.results) ? data.results : [];
      setSearchResults((current) => append ? [...current, ...results] : results);
      setHasMorePassages(Boolean(data.hasMore ?? results.length === SEARCH_PAGE_SIZE));
      setSearchExecutionMs(data.executionMs || 0);
      setSearchSource(data.source || '');
      setSearchWarning(
        data.warning && !String(data.warning).includes('found no matching passages')
          ? data.warning
          : null
      );
    } catch (err: any) {
      const message = err.message || 'Error communicating with archive search engine.';
      if (append) setPaginationError(message);
      else setError(message);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  // Initial load of documents for catalogue view & metadata facet population
  const fetchAllDocuments = async () => {
    try {
      const res = await fetch('/api/documents', { headers: await getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.documents)) {
        const docs: DocumentRecord[] = data.documents || [];
        setDocuments(docs);
        setArchiveWarning(
          data.source === 'local_vault'
            ? 'Supabase returned no usable document records; showing the local archive vault.'
            : data.source === 'supabase_and_local'
            ? null
            : data.error
            ? 'The archive database returned an error; some records may be in the local fallback vault.'
            : null
        );

        // Derive unique periods and locations
        const periods = Array.from(
          new Set(docs.map((d) => d.historical_period).filter(Boolean) as string[])
        );
        const locations = Array.from(
          new Set(docs.map((d) => d.location_name).filter(Boolean) as string[])
        );
        setAvailablePeriods(periods);
        setAvailableLocations(locations);
      }
    } catch (err: any) {
      setArchiveWarning(err.message || 'Could not load the document catalogue.');
    }
  };

  useEffect(() => {
    fetchAllDocuments();
    executeSearch('', 'all', 'all', 'all', 'all');
  }, []);

  const catalogDocuments = useMemo(() => {
    const queryTokens = activeQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return documents.filter((doc) => {
      if (filterType !== 'all' && doc.document_type !== filterType) return false;
      if (filterPeriod !== 'all' && doc.historical_period !== filterPeriod) return false;
      if (filterLocation !== 'all' && doc.location_name !== filterLocation) return false;
      if (filterVerification !== 'all' && doc.verification_status !== filterVerification) return false;
      const haystack = [doc.title, doc.description, doc.location_name, doc.historical_period, doc.language, doc.source_name, doc.attribution]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return queryTokens.every((token) => haystack.includes(token));
    });
  }, [documents, activeQuery, filterType, filterPeriod, filterLocation, filterVerification]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput);
    executeSearch(searchInput, filterType, filterPeriod, filterLocation, filterVerification);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveQuery('');
    executeSearch('', filterType, filterPeriod, filterLocation, filterVerification);
  };

  const handleClearFilters = () => {
    setFilterType('all');
    setFilterPeriod('all');
    setFilterLocation('all');
    setFilterVerification('all');
    executeSearch(activeQuery, 'all', 'all', 'all', 'all');
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchInput(tag);
    setActiveQuery(tag);
    executeSearch(tag, filterType, filterPeriod, filterLocation, filterVerification);
  };

  const handleOpenPassage = (item: ArchivePassageResult) => {
    // Locate the matching full document object
    const doc = documents.find((d) => d.id === item.documentId) || {
      id: item.documentId,
      title: item.documentTitle,
      document_type: item.documentType,
      historical_period: item.historicalPeriod,
      location_name: item.locationName,
      language: item.language,
      verification_status: item.verificationStatus,
      source_name: item.sourceName,
      attribution: item.attribution,
      storage_path: item.storagePath,
      original_filename: `${item.documentTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      mime_type: 'application/pdf',
      file_size_bytes: 0,
      description: item.extractedText,
      latitude: null,
      longitude: null,
      processing_status: 'completed',
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSelectedDoc(doc as DocumentRecord);
    setTargetPageNum(item.pageNumber);
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterPeriod !== 'all' ||
    filterLocation !== 'all' ||
    filterVerification !== 'all';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2D7C3] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#B38E46]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6860]">
              Digital Heritage Archive
            </span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#16192E]">
            Archive Explorer &amp; Passage Search
          </h1>
          <p className="mt-1 text-sm text-[#6B6860]">
            Search verified historical records and discover precise textual passages with page-level provenance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchAllDocuments();
              executeSearch();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2D7C3] bg-white px-3 py-2 text-xs font-medium text-[#16192E] hover:bg-[#F4EFE6] transition-colors disabled:opacity-50"
            title="Refresh search records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToUpload}
            className="flex items-center gap-1.5 rounded-lg bg-[#16192E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#272B40] transition-colors"
          >
            <Plus className="h-4 w-4 text-[#C9A45C]" />
            <span>Deposit Folio</span>
          </button>
        </div>
      </div>

      {/* Main Search Command Bar */}
      <div className="mt-6 rounded-2xl border border-[#C9BBA2] bg-radial from-[#FBF9F4] to-[#F4EFE6] p-6 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-[#8E8A81]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search historical passages, architectural terms, inscriptions, or surveyors..."
              className="w-full rounded-xl border border-[#C9BBA2] bg-white py-3 pl-11 pr-10 text-sm text-[#16192E] shadow-inner placeholder:text-[#8E8A81] focus:border-[#B38E46] focus:outline-none focus:ring-2 focus:ring-[#B38E46]/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-[#8E8A81] hover:text-[#16192E]"
                aria-label="Clear search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B38E46] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#9F7628] transition-colors disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            <span>Search Archive</span>
          </button>
        </form>

        {/* Quick Suggestion Tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#6B6860]">
          <span className="font-semibold text-[#8E8A81]">Suggested Queries:</span>
          {['Burgess 1876', 'Kathiawad', 'Rani ki Vav', 'Solanki', 'Patan', 'Sun Temple'].map(
            (tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="rounded-full border border-[#E2D7C3] bg-white px-3 py-1 font-mono text-[11px] text-[#16192E] hover:border-[#B38E46] hover:bg-[#F4EFE6] transition-colors"
              >
                {tag}
              </button>
            )
          )}
        </div>
      </div>

      {/* Structured Facet Filters Bar */}
      <div className="mt-5 rounded-xl border border-[#E2D7C3] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-[#E2D7C3]/60 pb-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#16192E]">
            <SlidersHorizontal className="h-4 w-4 text-[#B38E46]" />
            <span>Metadata Facet Filters</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-[#B38E46] hover:underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {/* Classification Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8E8A81] mb-1">
              Document Classification
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                const val = e.target.value as DocumentType | 'all';
                setFilterType(val);
                executeSearch(activeQuery, val, filterPeriod, filterLocation, filterVerification);
              }}
              className="w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3 py-1.5 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
            >
              <option value="all">All Classifications</option>
              <option value="architectural_record">Architectural Records</option>
              <option value="manuscript">Manuscripts / Epigraphs</option>
              <option value="historical_document">Historical Documents</option>
              <option value="photograph">Photographs</option>
              <option value="map">Maps</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Historical Era Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8E8A81] mb-1">
              Historical Era / Period
            </label>
            <select
              value={filterPeriod}
              onChange={(e) => {
                const val = e.target.value;
                setFilterPeriod(val);
                executeSearch(activeQuery, filterType, val, filterLocation, filterVerification);
              }}
              className="w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3 py-1.5 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
            >
              <option value="all">All Eras &amp; Periods</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8E8A81] mb-1">
              Geographic Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => {
                const val = e.target.value;
                setFilterLocation(val);
                executeSearch(activeQuery, filterType, filterPeriod, val, filterVerification);
              }}
              className="w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3 py-1.5 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
            >
              <option value="all">All Locations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8E8A81] mb-1">
              Verification Status
            </label>
            <select
              value={filterVerification}
              onChange={(e) => {
                const val = e.target.value as VerificationStatus | 'all';
                setFilterVerification(val);
                executeSearch(activeQuery, filterType, filterPeriod, filterLocation, val);
              }}
              className="w-full rounded-lg border border-[#E2D7C3] bg-[#FBF9F4] px-3 py-1.5 text-xs text-[#16192E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B38E46]"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Records Only</option>
              <option value="unverified">Unverified Ingestions</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header & View Mode Switcher */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#E2D7C3] pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode('passages')}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 pb-3 text-xs font-semibold transition-colors ${
              viewMode === 'passages'
                ? 'border-[#B38E46] text-[#16192E]'
                : 'border-transparent text-[#8E8A81] hover:text-[#16192E]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Passage Search Results ({searchResults.length} loaded)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('documents')}
            className={`inline-flex items-center gap-1.5 border-b-2 px-3 pb-3 text-xs font-semibold transition-colors ${
              viewMode === 'documents'
                ? 'border-[#B38E46] text-[#16192E]'
                : 'border-transparent text-[#8E8A81] hover:text-[#16192E]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Document Catalogue ({catalogDocuments.length})</span>
          </button>
        </div>

        <div className="text-xs text-[#8E8A81] flex items-center gap-2">
          {searchExecutionMs > 0 && (
            <span>Query executed in <strong className="font-mono text-[#16192E]">{searchExecutionMs}ms</strong></span>
          )}
          {searchSource && (
            <span className="rounded bg-[#EDE5D5] px-2 py-0.5 font-mono text-[10px] text-[#6B6860]">
              {searchSource === 'supabase_postgres_fts'
                ? 'PostgreSQL FTS'
                : searchSource === 'supabase_deterministic'
                ? 'Database deterministic fallback'
                : 'Local deterministic fallback'}
            </span>
          )}
        </div>
      </div>

      {(searchWarning || archiveWarning) && (
        <div className="mt-4 space-y-2" aria-live="polite">
          {searchWarning && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{searchWarning}</p>}
          {archiveWarning && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{archiveWarning}</p>}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-12 flex flex-col items-center justify-center py-16 text-center">
          <RefreshCw className="h-8 w-8 text-[#B38E46] animate-spin mb-3" />
          <p className="text-xs text-[#6B6860] font-medium">
            Scanning extracted archival text and indexing passages...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-800">
          <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <strong className="block font-serif text-sm font-bold text-red-900">
            Search Engine Query Failed
          </strong>
          <p className="mt-1 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => executeSearch()}
            className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-xs font-semibold text-white hover:bg-red-900"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* Empty State: No results for search query */}
      {!loading && !error && viewMode === 'passages' && searchResults.length === 0 && (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[#C9BBA2] bg-[#F4EFE6]/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE5D5] text-[#B38E46] mb-4">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#16192E]">
            {activeQuery ? `No Passages Found for "${activeQuery}"` : 'No Archival Records Match Current Filters'}
          </h2>
          <p className="mt-2 max-w-md mx-auto text-xs leading-relaxed text-[#6B6860]">
            {activeQuery
              ? 'Try searching with broader architectural terms, historical periods (e.g. "1876" or "11th century"), or regional landmarks (e.g. "Patan", "Modhera").'
              : 'Try clearing your metadata filters or depositing new historical folios into the archive.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-lg border border-[#C9BBA2] bg-white px-4 py-2 text-xs font-semibold text-[#16192E] hover:bg-[#F4EFE6]"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#16192E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#272B40]"
            >
              <Plus className="h-4 w-4 text-[#C9A45C]" />
              <span>Deposit New Document</span>
            </button>
          </div>
        </div>
      )}

      {/* View Mode A: Granular Passage Search Results */}
      {!loading && !error && viewMode === 'passages' && searchResults.length > 0 && (
        <div className="mt-6 space-y-4">
          {searchResults.map((item) => {
            const snippetSegments = highlightMatchingSegments(item.snippet, activeQuery);

            return (
              <article
                key={`${item.documentId}-${item.pageNumber}-${item.passageId}`}
                onClick={() => handleOpenPassage(item)}
                className="group cursor-pointer rounded-xl border border-[#E2D7C3] bg-white p-5 shadow-xs transition-all hover:border-[#B38E46] hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D7C3]/60 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#F4EFE6] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#B38E46] border border-[#E2D7C3]">
                      {item.documentType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="rounded bg-[#16192E] px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                      Folio Page {item.pageNumber}
                    </span>
                    {item.confidenceScore !== null && (
                      <span className="text-[11px] font-mono text-[#6B6860]">
                        Score: {(item.confidenceScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#6B6860]">
                    {item.locationName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#B38E46]" />
                        {item.locationName}
                      </span>
                    )}
                    {item.historicalPeriod && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#B38E46]" />
                        {item.historicalPeriod}
                      </span>
                    )}
                  </div>
                </div>

                {/* Parent Document Title */}
                <h3 className="mt-3 font-serif text-lg font-bold text-[#16192E] group-hover:text-[#B38E46] transition-colors">
                  {item.documentTitle}
                </h3>

                {/* Highlighted Text Passage Snippet */}
                <div className="mt-2.5 rounded-lg border border-[#E2D7C3]/60 bg-[#FAF8F5] p-3.5 font-serif text-sm text-[#16192E] leading-relaxed">
                  &ldquo;
                  {snippetSegments.map((seg, idx) =>
                    seg.isMatch ? (
                      <mark
                        key={idx}
                        className="rounded bg-[#B38E46]/25 px-1 py-0.5 font-semibold text-[#16192E]"
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={idx}>{seg.text}</span>
                    )
                  )}
                  &rdquo;
                </div>

                {/* Card Footer with Provenance and Action */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8E8A81] pt-2 border-t border-[#E2D7C3]/40">
                  <div className="flex items-center gap-2">
                    <span>Source: {item.sourceName || 'Primary Archive'}</span>
                    <span>&bull;</span>
                    <span>Method: <code className="font-mono">{item.extractionMethod}</code></span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-semibold text-[#B38E46] group-hover:translate-x-1 transition-transform">
                    <span>View Page {item.pageNumber} In Context</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
          {paginationError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">Could not load the next passage page: {paginationError}</p>}
          {hasMorePassages && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => executeSearch(activeQuery, filterType, filterPeriod, filterLocation, filterVerification, searchResults.length, true)}
                className="rounded-lg border border-[#C9BBA2] bg-white px-5 py-2.5 text-xs font-semibold text-[#16192E] hover:bg-[#F4EFE6] disabled:opacity-60"
              >
                {loadingMore ? 'Loading passages…' : 'Load more passages'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Mode B: Document Catalogue Grid */}
      {!loading && !error && viewMode === 'documents' && catalogDocuments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalogDocuments.map((doc) => (
            <article
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc);
                setTargetPageNum(1);
              }}
              className="group cursor-pointer flex flex-col justify-between rounded-xl border border-[#E2D7C3] bg-white p-5 shadow-xs transition-all hover:border-[#B38E46] hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#6B6860]">
                  <span className="font-mono uppercase font-semibold text-[#B38E46]">
                    {doc.document_type.replace('_', ' ')}
                  </span>
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>

                <h3 className="mt-2 font-serif text-base font-bold text-[#16192E] line-clamp-2 group-hover:text-[#B38E46] transition-colors">
                  {doc.title}
                </h3>

                {doc.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#6B6860]">
                    {doc.description}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 border-t border-[#E2D7C3]/60 pt-3 text-[11px] text-[#6B6860]">
                  {doc.location_name && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 text-[#B38E46] shrink-0" />
                      <span className="truncate">{doc.location_name}</span>
                    </div>
                  )}

                  {doc.historical_period && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="h-3 w-3 text-[#B38E46] shrink-0" />
                      <span>{doc.historical_period}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E2D7C3]/60 pt-3 text-[11px]">
                <span className="font-mono text-[#8E8A81]">
                  {formatBytes(doc.file_size_bytes)} &bull; {doc.original_filename.split('.').pop()?.toUpperCase()}
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#B38E46] group-hover:underline">
                  <span>Inspect</span>
                  <Eye className="h-3.5 w-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && viewMode === 'documents' && catalogDocuments.length === 0 && (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[#C9BBA2] bg-[#F4EFE6]/60 p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-[#B38E46]" />
          <h2 className="font-serif text-lg font-bold text-[#16192E]">No documents match these filters</h2>
          <p className="mt-2 text-xs text-[#6B6860]">Clear the search or filters to see all {documents.length} catalogue records.</p>
        </div>
      )}

      {/* Document Detail Modal targeted to matching page */}
      <DocumentDetailModal
        document={selectedDoc}
        initialPageNumber={targetPageNum}
        onClose={() => setSelectedDoc(null)}
        onStatusUpdated={(documentId, status) => {
          setDocuments((current) => current.map((doc) =>
            doc.id === documentId
              ? { ...doc, processing_status: status, updated_at: new Date().toISOString() }
              : doc
          ));
        }}
      />
    </div>
  );
};