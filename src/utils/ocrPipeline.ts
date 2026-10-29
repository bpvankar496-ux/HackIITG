/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExtractionMethod, PageExtractionStatus } from '../types/database.types.ts';

export type ExtractionRoute = 'pdf_text_layer' | 'gemini_multimodal_ocr' | 'unsupported';

export interface RouteDecision {
  route: ExtractionRoute;
  reason: string;
  isScannedOrVisual: boolean;
}

/**
 * Determines whether to extract via native PDF text layer or route to Gemini Multimodal OCR.
 *
 * @param mimeType - Normalized MIME type of the asset
 * @param rawTextLayerLength - Number of characters found in native PDF text stream (0 if image or unread)
 * @param pageCount - Number of pages (defaults to 1 for images)
 */
export function determineExtractionRoute(
  mimeType: string,
  rawTextLayerLength: number = 0,
  pageCount: number = 1
): RouteDecision {
  const normalizedMime = (mimeType || '').toLowerCase().trim();

  // 1. Supported image formats always route to Gemini OCR
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(normalizedMime)) {
    return {
      route: 'gemini_multimodal_ocr',
      reason: 'Image format requires visual OCR analysis.',
      isScannedOrVisual: true,
    };
  }

  // 2. PDF Documents: inspect text layer density
  if (normalizedMime === 'application/pdf') {
    const safePageCount = Math.max(1, pageCount);
    const avgCharsPerPage = rawTextLayerLength / safePageCount;

    // If fewer than 20 characters per page, it is overwhelmingly likely a scanned manuscript, plate, or photograph
    if (avgCharsPerPage < 20) {
      return {
        route: 'gemini_multimodal_ocr',
        reason: `Scanned or visual PDF detected (${Math.round(avgCharsPerPage)} chars/page). Routing to Gemini Multimodal OCR.`,
        isScannedOrVisual: true,
      };
    }

    return {
      route: 'pdf_text_layer',
      reason: `Usable text layer detected (${Math.round(avgCharsPerPage)} chars/page across ${safePageCount} page(s)).`,
      isScannedOrVisual: false,
    };
  }

  return {
    route: 'unsupported',
    reason: `MIME type "${mimeType}" is not supported for text extraction.`,
    isScannedOrVisual: false,
  };
}

/**
 * Sanitizes extracted text by removing corrupt binary artifacts and non-printable control characters,
 * while preserving valid Unicode scripts (Devanagari, Gujarati, Perso-Arabic, Latin diacritics).
 */
export function sanitizeExtractedText(raw: string): string {
  if (!raw) return '';

  return (
    raw
      // Remove control characters except tab (\t), newline (\n), carriage return (\r)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize Unicode canonical decomposition/composition
      .normalize('NFC')
      // Strip trailing whitespaces on each line
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim()
  );
}

/**
 * Computes word count accurately across Latin, Devanagari, and Indian regional scripts,
 * excluding standalone punctuation marks and script dandas.
 */
export function computeWordCount(text: string): number {
  if (!text) return 0;
  const rawTokens = text.trim().match(/[\S]+/g) || [];
  // Filter out pure punctuation tokens like '.', '?', '।', '॥'
  const lexicalWords = rawTokens.filter((token) => !/^[.,;:!?'"|।॥()\-–—\[\]{}]+$/.test(token));
  return lexicalWords.length;
}

/**
 * Classifies page extraction outcome into strict status states.
 */
export function classifyPageStatus(
  text: string,
  confidenceScore: number | null = null
): PageExtractionStatus {
  const clean = text.trim();
  if (clean.length === 0) {
    return 'empty_page';
  }

  // If confidence score is explicitly reported and below 0.50, flag for human curator review
  if (confidenceScore !== null && confidenceScore < 0.5) {
    return 'needs_review';
  }

  return 'completed';
}

/**
 * Computes or sanitizes confidence score (bounded in [0.0, 1.0]).
 */
export function calculateConfidenceScore(
  method: ExtractionMethod,
  text: string,
  providerConfidence?: number | null
): number {
  if (method === 'empty_page_marker') {
    return 1.0;
  }

  if (method === 'pdf_text_layer') {
    // Native embedded digital fonts have near-perfect fidelity
    return 0.99;
  }

  // Gemini Multimodal OCR
  if (providerConfidence !== undefined && providerConfidence !== null) {
    return Math.max(0, Math.min(1.0, Number(providerConfidence.toFixed(2))));
  }

  // Heuristic confidence estimation for visual OCR based on text coherence
  const trimmed = text.trim();
  if (trimmed.length === 0) return 1.0; // empty page

  // High proportion of unusual non-alphanumeric symbols indicates degraded scan or corrupted extraction
  const unusualChars = (trimmed.match(/[^a-zA-Z0-9\s\u0900-\u097F\u0A80-\u0AFF]/g) || []).length;
  const noiseRatio = unusualChars / trimmed.length;

  if (noiseRatio > 0.30) {
    return 0.45; // needs review
  }
  if (noiseRatio > 0.15) {
    return 0.75;
  }
  return 0.92;
}

/**
 * Splits continuous multi-page PDF extracted text if delimited by form-feed characters (\f)
 * or explicit page headers.
 */
export function segmentTextIntoPages(
  rawText: string,
  expectedTotalPages: number = 1
): Array<{ pageNumber: number; text: string }> {
  if (!rawText) {
    return Array.from({ length: Math.max(1, expectedTotalPages) }, (_, idx) => ({
      pageNumber: idx + 1,
      text: '',
    }));
  }

  // Check for form feed character \f
  if (rawText.includes('\f')) {
    const parts = rawText.split('\f');
    return parts.map((part, index) => ({
      pageNumber: index + 1,
      text: sanitizeExtractedText(part),
    }));
  }

  // Check for explicit "--- PAGE X ---" markers
  const pageMarkerRegex = /(?:^|\n)---+\s*(?:PAGE|Page)\s+(\d+)\s*---+/gi;
  if (pageMarkerRegex.test(rawText)) {
    const pages: Array<{ pageNumber: number; text: string }> = [];
    const segments = rawText.split(/(?:^|\n)---+\s*(?:PAGE|Page)\s+\d+\s*---+/gi);
    
    // First segment might be before Page 1 or empty
    let pageIdx = 1;
    for (const segment of segments) {
      const clean = sanitizeExtractedText(segment);
      if (clean || pageIdx <= expectedTotalPages) {
        pages.push({ pageNumber: pageIdx, text: clean });
        pageIdx++;
      }
    }
    return pages.length > 0 ? pages : [{ pageNumber: 1, text: sanitizeExtractedText(rawText) }];
  }

  // Single page fallback
  return [{ pageNumber: 1, text: sanitizeExtractedText(rawText) }];
}
