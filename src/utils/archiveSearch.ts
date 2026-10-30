/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentType, VerificationStatus, ExtractionMethod, PageExtractionStatus } from '../types/database.types.ts';

export interface SearchFilters {
  query?: string;
  documentType?: DocumentType | 'all';
  historicalPeriod?: string | 'all';
  location?: string | 'all';
  language?: string | 'all';
  verificationStatus?: VerificationStatus | 'all';
}

export interface ArchivePassageResult {
  passageId: string;
  documentId: string;
  pageNumber: number;
  extractedText: string;
  snippet: string;
  confidenceScore: number | null;
  extractionMethod: ExtractionMethod;
  extractionStatus: PageExtractionStatus;
  documentTitle: string;
  documentType: DocumentType;
  historicalPeriod: string | null;
  locationName: string | null;
  language: string | null;
  verificationStatus: VerificationStatus;
  sourceName: string | null;
  attribution: string | null;
  storagePath: string;
  relevanceScore: number;
}

/**
 * Extracts a concise, readable textual snippet centered around the best match for the query terms.
 * Never cuts words in half; adds leading and trailing ellipses where text is clipped.
 */
export function extractSnippet(text: string, query: string, maxLen: number = 160): string {
  if (!text) return '';
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLen) return cleanText;

  const terms = (query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (terms.length === 0) {
    // Return first window
    const firstCut = cleanText.slice(0, maxLen);
    const lastSpace = firstCut.lastIndexOf(' ');
    return (lastSpace > 0 ? firstCut.slice(0, lastSpace) : firstCut) + '...';
  }

  // Find the first matching term index
  let bestIndex = -1;
  for (const term of terms) {
    const idx = cleanText.toLowerCase().indexOf(term);
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
      bestIndex = idx;
    }
  }

  if (bestIndex === -1) {
    const firstCut = cleanText.slice(0, maxLen);
    const lastSpace = firstCut.lastIndexOf(' ');
    return (lastSpace > 0 ? firstCut.slice(0, lastSpace) : firstCut) + '...';
  }

  // Calculate centered window
  const half = Math.floor(maxLen / 2);
  let start = Math.max(0, bestIndex - half);
  let end = Math.min(cleanText.length, start + maxLen);

  if (end === cleanText.length) {
    start = Math.max(0, end - maxLen);
  }

  // Snap to word boundaries
  if (start > 0) {
    const spaceAfterStart = cleanText.indexOf(' ', start);
    if (spaceAfterStart !== -1 && spaceAfterStart < start + 20) {
      start = spaceAfterStart + 1;
    }
  }

  if (end < cleanText.length) {
    const spaceBeforeEnd = cleanText.lastIndexOf(' ', end);
    if (spaceBeforeEnd !== -1 && spaceBeforeEnd > end - 20) {
      end = spaceBeforeEnd;
    }
  }

  const snippet = cleanText.slice(start, end).trim();
  const prefix = start > 0 ? '...' : '';
  const suffix = end < cleanText.length ? '...' : '';

  return `${prefix}${snippet}${suffix}`;
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Parses text and query into safe alternating segments for safe React rendering,
 * completely avoiding unsafe dangerouslySetInnerHTML injection.
 */
export function highlightMatchingSegments(
  text: string,
  query: string
): HighlightSegment[] {
  if (!text) return [];
  if (!query || !query.trim()) {
    return [{ text, isMatch: false }];
  }

  // Extract search terms (ignoring very short words like 'in', 'of')
  const rawTerms = query
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter((t) => t.length > 0);

  if (rawTerms.length === 0) {
    return [{ text, isMatch: false }];
  }

  const regex = new RegExp(`(${rawTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  const segments: HighlightSegment[] = [];

  for (const part of parts) {
    if (!part) continue;
    const isMatch = rawTerms.some(
      (term) => part.toLowerCase() === term.toLowerCase()
    );
    segments.push({ text: part, isMatch });
  }

  return segments;
}

/**
 * Calculates a multi-field relevance score for ranking passages.
 */
export function calculateRelevanceScore(
  docTitle: string,
  docLocation: string,
  docPeriod: string,
  pageText: string,
  query: string
): number {
  if (!query || !query.trim()) return 1.0;

  const qLower = query.toLowerCase().trim();
  const titleLower = (docTitle || '').toLowerCase();
  const locLower = (docLocation || '').toLowerCase();
  const periodLower = (docPeriod || '').toLowerCase();
  const pageLower = (pageText || '').toLowerCase();

  let score = 0;

  // Exact phrase matches
  if (titleLower.includes(qLower)) score += 50;
  if (locLower.includes(qLower)) score += 25;
  if (periodLower.includes(qLower)) score += 15;
  if (pageLower.includes(qLower)) score += 30;

  // Token matches excluding common query stop words
  const STOP_WORDS = new Set([
    'the', 'what', 'were', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was',
    'who', 'which', 'how', 'when', 'where', 'can', 'about', 'some', 'any', 'does', 'did',
    'tell', 'explain', 'show', 'give', 'into', 'have', 'has', 'had', 'been'
  ]);
  const tokens = qLower
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  for (const token of tokens) {
    if (titleLower.includes(token)) score += 10;
    if (locLower.includes(token)) score += 8;
    if (periodLower.includes(token)) score += 5;

    // Count term frequency in page text
    const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = pageLower.match(regex);
    if (matches) {
      score += Math.min(20, matches.length * 3);
    }
  }

  return score;
}

/**
 * Pure filter function applying search filters across document and page metadata.
 */
export function applyArchiveFilters(
  results: ArchivePassageResult[],
  filters: SearchFilters
): ArchivePassageResult[] {
  return results.filter((item) => {
    // 1. Document Type Filter
    if (filters.documentType && filters.documentType !== 'all') {
      if (item.documentType !== filters.documentType) return false;
    }

    // 2. Historical Period Filter
    if (filters.historicalPeriod && filters.historicalPeriod !== 'all') {
      const p = (item.historicalPeriod || '').toLowerCase();
      if (!p.includes(filters.historicalPeriod.toLowerCase())) return false;
    }

    // 3. Location Filter
    if (filters.location && filters.location !== 'all') {
      const loc = (item.locationName || '').toLowerCase();
      if (!loc.includes(filters.location.toLowerCase())) return false;
    }

    // 4. Language Filter
    if (filters.language && filters.language !== 'all') {
      const lang = (item.language || '').toLowerCase();
      if (!lang.includes(filters.language.toLowerCase())) return false;
    }

    // 5. Verification Status Filter
    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      if (item.verificationStatus !== filters.verificationStatus) return false;
    }

    return true;
  });
}
