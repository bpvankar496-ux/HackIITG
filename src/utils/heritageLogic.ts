/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HeritageSiteItem {
  id: string;
  slug: string;
  name: string;
  state: string;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
  category: string;
  period?: string | null;
  description?: string | null;
  story?: string | null;
  source?: string | null;
  verification: 'verified' | 'unverified' | 'community';
  is_demo?: boolean;
}

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateGpsDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // Earth's radius in meters
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Checks if user is within the geofenced threshold (default 300 meters).
 */
export function isWithinGpsThreshold(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  thresholdMeters: number = 300
): { verified: boolean; distance: number; threshold: number } {
  const distance = calculateGpsDistance(userLat, userLng, targetLat, targetLng);
  return {
    verified: distance <= thresholdMeters,
    distance,
    threshold: thresholdMeters,
  };
}

/**
 * Filters and searches heritage sites by keyword, category, state, and historical period.
 */
export function filterHeritageSites(
  sites: HeritageSiteItem[],
  filters: {
    query?: string;
    category?: string;
    state?: string;
    period?: string;
  }
): HeritageSiteItem[] {
  const q = (filters.query || '').trim().toLowerCase();
  const cat = (filters.category || '').trim().toLowerCase();
  const st = (filters.state || '').trim().toLowerCase();
  const per = (filters.period || '').trim().toLowerCase();

  return sites.filter((site) => {
    if (cat && site.category.toLowerCase() !== cat) {
      return false;
    }
    if (st && site.state.toLowerCase() !== st) {
      return false;
    }
    if (per && !(site.period || '').toLowerCase().includes(per)) {
      return false;
    }
    if (q) {
      const haystack = [
        site.name,
        site.state,
        site.district || '',
        site.category,
        site.period || '',
        site.description || '',
        site.story || '',
      ]
        .join(' ')
        .toLowerCase();

      // All search tokens must match
      const tokens = q.split(/\s+/).filter(Boolean);
      const matchesAll = tokens.every((token) => haystack.includes(token));
      if (!matchesAll) return false;
    }
    return true;
  });
}

/**
 * Splits extracted OCR document text into searchable, citation-friendly passages.
 */
export function extractPassagesFromText(
  rawText: string,
  minCharCount: number = 50
): { pageNumber: number; text: string; wordCount: number }[] {
  if (!rawText || !rawText.trim()) return [];

  // Split by explicit page markers if present (e.g., "[Page 1]" or "--- Page 2 ---")
  const pageRegex = /(?:\[Page\s*(\d+)\]|---+\s*Page\s*(\d+)\s*---+)/gi;
  const matches = [...rawText.matchAll(pageRegex)];

  if (matches.length > 0) {
    const passages: { pageNumber: number; text: string; wordCount: number }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const pageNum = parseInt(match[1] || match[2] || `${i + 1}`, 10);
      const startIndex = match.index! + match[0].length;
      const endIndex = i + 1 < matches.length ? matches[i + 1].index! : rawText.length;
      const pageText = rawText.substring(startIndex, endIndex).trim();

      if (pageText.length >= minCharCount) {
        passages.push({
          pageNumber: pageNum,
          text: pageText,
          wordCount: pageText.split(/\s+/).filter(Boolean).length,
        });
      }
    }
    if (passages.length > 0) return passages;
  }

  // Fallback: chunk by paragraphs or sections
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= minCharCount);

  if (paragraphs.length === 0) {
    return [
      {
        pageNumber: 1,
        text: rawText.trim(),
        wordCount: rawText.split(/\s+/).filter(Boolean).length,
      },
    ];
  }

  return paragraphs.map((para, idx) => ({
    pageNumber: idx + 1,
    text: para,
    wordCount: para.split(/\s+/).filter(Boolean).length,
  }));
}
