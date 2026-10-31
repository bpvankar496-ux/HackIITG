/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServiceSupabaseClient as getSupabaseServiceClient } from '../lib/supabaseAdmin.ts';
import fs from 'fs';
import path from 'path';
import {
  ArchivePassageResult,
  SearchFilters,
  extractSnippet,
  calculateRelevanceScore,
  applyArchiveFilters,
} from '../utils/archiveSearch.ts';
import type {
  DocumentRecord,
  DocumentPageRecord,
} from '../types/database.types.ts';

const LOCAL_DOCS_VAULT = path.resolve(process.cwd(), 'data/documents_vault.json');
const LOCAL_PAGES_VAULT = path.resolve(process.cwd(), 'data/document_pages_vault.json');

function readLocalDocs(): DocumentRecord[] {
  try {
    if (!fs.existsSync(LOCAL_DOCS_VAULT)) return [];
    return JSON.parse(fs.readFileSync(LOCAL_DOCS_VAULT, 'utf-8') || '[]');
  } catch {
    return [];
  }
}

function readLocalPages(): DocumentPageRecord[] {
  try {
    if (!fs.existsSync(LOCAL_PAGES_VAULT)) return [];
    return JSON.parse(fs.readFileSync(LOCAL_PAGES_VAULT, 'utf-8') || '[]');
  } catch {
    return [];
  }
}

export interface SearchExecutionResponse {
  results: ArchivePassageResult[];
  totalPassagesMatched: number;
  totalDocumentsMatched: number;
  query: string;
  filters: SearchFilters;
  source: 'supabase_postgres_fts' | 'supabase_deterministic' | 'local_search_engine';
  executionMs: number;
  hasMore: boolean;
  warning?: string;
  error?: string | null;
}

async function loadRemoteTable(table: 'documents' | 'document_pages'): Promise<any[]> {
  const client = getSupabaseServiceClient();
  const batchSize = 500;
  const rows: any[] = [];

  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < batchSize) return rows;
  }
}

/**
 * Searches archival passages and document metadata using PostgreSQL full-text search,
 * with deterministic fallback to server-side search over local vaults.
 */
export async function searchArchivalPassages(
  filters: SearchFilters,
  limit: number = 30,
  offset: number = 0,
  viewerUserId: string | null = null
): Promise<SearchExecutionResponse> {
  const startTime = Date.now();
  const query = (filters.query || '').trim();
  let rpcUnavailable = false;

  try {
    const client = getSupabaseServiceClient();

    // 1. Attempt PostgreSQL stored procedure search_archive_passages with 2.5s timeout
    const rpcPromise = client.rpc('search_archive_passages', {
      search_query: query,
      filter_doc_type: filters.documentType || 'all',
      filter_period: filters.historicalPeriod || 'all',
      filter_location: filters.location || 'all',
      filter_language: filters.language || 'all',
      filter_verification: filters.verificationStatus || 'all',
      limit_val: limit + 1,
      offset_val: offset,
      viewer_user_id: viewerUserId,
    });

    const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase RPC call timed out')), 2500)
    );

    const { data: rpcData, error: rpcError } = (await Promise.race([
      rpcPromise,
      timeoutPromise,
    ])) as any;

    if (!rpcError && Array.isArray(rpcData) && (rpcData.length > 0 || readLocalDocs().length === 0)) {
      const hasMore = rpcData.length > limit;
      const results: ArchivePassageResult[] = rpcData.slice(0, limit).map((row: any) => ({
        passageId: row.passage_id,
        documentId: row.document_id,
        pageNumber: row.page_number,
        extractedText: row.extracted_text,
        snippet: row.snippet || extractSnippet(row.extracted_text, query),
        confidenceScore: row.confidence_score,
        extractionMethod: row.extraction_method,
        extractionStatus: row.extraction_status,
        documentTitle: row.document_title,
        documentType: row.document_type,
        historicalPeriod: row.historical_period,
        locationName: row.location_name,
        language: row.language,
        verificationStatus: row.verification_status,
        sourceName: row.source_name,
        attribution: row.attribution,
        storagePath: row.storage_path,
        relevanceScore: row.relevance_rank || 1.0,
      }));

      const uniqueDocs = new Set(results.map((r) => r.documentId));

      return {
        results,
        totalPassagesMatched: offset + results.length,
        totalDocumentsMatched: uniqueDocs.size,
        query,
        filters,
        source: 'supabase_postgres_fts',
        executionMs: Date.now() - startTime,
        hasMore,
      };
    }
    rpcUnavailable = true;
    if (rpcError) console.warn('PostgreSQL FTS unavailable or pending migration:', rpcError.message);
  } catch (err: any) {
    rpcUnavailable = true;
    console.warn('PostgreSQL FTS unavailable or pending migration:', err.message);
  }

  // 2. If FTS is unavailable, search the database corpus before using local files.
  const localDocs = readLocalDocs();
  const localPages = readLocalPages();
  let allDocs = localDocs;
  let allPages = localPages;
  let source: SearchExecutionResponse['source'] = 'local_search_engine';
  let warning = rpcUnavailable
    ? 'PostgreSQL full-text search is unavailable; using deterministic fallback search.'
    : 'PostgreSQL full-text search found no matching passages; checking the database and local archive with deterministic search.';
  try {
    const [remoteDocs, remotePages] = await Promise.all([
      loadRemoteTable('documents'),
      loadRemoteTable('document_pages'),
    ]);
    const mergedDocs = new Map<string, DocumentRecord>();
    remoteDocs.forEach((doc) => mergedDocs.set(doc.id, doc));
    localDocs.forEach((doc) => {
      if (!mergedDocs.has(doc.id)) mergedDocs.set(doc.id, doc);
    });
    allDocs = Array.from(mergedDocs.values()).filter(
      (doc) => doc.verification_status !== 'unverified' || doc.created_by === viewerUserId
    );

    const mergedPages = new Map<string, DocumentPageRecord>();
    remotePages.forEach((page) => mergedPages.set(`${page.document_id}:${page.page_number}`, page));
    localPages.forEach((page) => {
      const key = `${page.document_id}:${page.page_number}`;
      if (!mergedPages.has(key)) mergedPages.set(key, page);
    });
    allPages = Array.from(mergedPages.values());
    source = remoteDocs.length || remotePages.length ? 'supabase_deterministic' : 'local_search_engine';
    warning = rpcUnavailable
      ? 'PostgreSQL full-text search is unavailable; searching database and local archive records with deterministic search.'
      : 'PostgreSQL full-text search found no matching passages; checking the database and local archive with deterministic search.';
  } catch (err: any) {
    if (rpcUnavailable) {
      console.warn('Database fallback search unavailable:', err.message);
      warning = 'Database search is unavailable; showing the local archive only.';
    }
  }

  const docsMap = new Map<string, DocumentRecord>();
  allDocs.forEach((d) => docsMap.set(d.id, d));

  const candidateResults: ArchivePassageResult[] = [];

  for (const page of allPages) {
    const doc = docsMap.get(page.document_id);
    if (!doc) continue;
    if (page.extraction_status !== 'completed' && page.extraction_status !== 'needs_review') continue;

    // Check query match across page text and document metadata
    const score = calculateRelevanceScore(
      doc.title,
      doc.location_name || '',
      doc.historical_period || '',
      page.extracted_text,
      query
    );

    // If query is empty, include all; otherwise require score > 0
    if (!query || score > 0) {
      candidateResults.push({
        passageId: page.id,
        documentId: doc.id,
        pageNumber: page.page_number,
        extractedText: page.extracted_text,
        snippet: extractSnippet(page.extracted_text || doc.description || doc.title, query),
        confidenceScore: page.confidence_score,
        extractionMethod: page.extraction_method,
        extractionStatus: page.extraction_status,
        documentTitle: doc.title,
        documentType: doc.document_type,
        historicalPeriod: doc.historical_period,
        locationName: doc.location_name,
        language: doc.language,
        verificationStatus: doc.verification_status,
        sourceName: doc.source_name,
        attribution: doc.attribution,
        storagePath: doc.storage_path,
        relevanceScore: score,
      });
    }
  }

  // Also include matching documents that have no extracted pages yet
  if (candidateResults.length === 0) {
    for (const doc of allDocs) {
      const score = calculateRelevanceScore(
        doc.title,
        doc.location_name || '',
        doc.historical_period || '',
        doc.description || '',
        query
      );

      if (!query || score > 0) {
        candidateResults.push({
          passageId: doc.id,
          documentId: doc.id,
          pageNumber: 1,
          extractedText: doc.description || '',
          snippet: extractSnippet(doc.description || doc.title, query),
          confidenceScore: null,
          extractionMethod: 'pdf_text_layer',
          extractionStatus: 'completed',
          documentTitle: doc.title,
          documentType: doc.document_type,
          historicalPeriod: doc.historical_period,
          locationName: doc.location_name,
          language: doc.language,
          verificationStatus: doc.verification_status,
          sourceName: doc.source_name,
          attribution: doc.attribution,
          storagePath: doc.storage_path,
          relevanceScore: score,
        });
      }
    }
  }

  // Never surface unverified records unless their authenticated owner is viewing them.
  const visibleResults = candidateResults.filter((result) => {
    if (result.verificationStatus !== 'unverified') return true;
    const doc = docsMap.get(result.documentId);
    return Boolean(viewerUserId && doc?.created_by === viewerUserId);
  });

  // Apply filters
  const filtered = applyArchiveFilters(visibleResults, filters);

  // Sort by relevance score descending
  filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const paginated = filtered.slice(offset, offset + limit);
  const matchedDocs = new Set(filtered.map((p) => p.documentId));

  return {
    results: paginated,
    totalPassagesMatched: filtered.length,
    totalDocumentsMatched: matchedDocs.size,
    query,
    filters,
    source,
    executionMs: Date.now() - startTime,
    hasMore: offset + limit < filtered.length,
    warning,
  };
}
