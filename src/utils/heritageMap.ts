/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DocumentRecord, DocumentType, VerificationStatus } from '../types/database.types.ts';

export interface MapFilters {
  query?: string;
  documentType?: DocumentType | 'all';
  historicalPeriod?: string | 'all';
  language?: string | 'all';
  verificationStatus?: VerificationStatus | 'all';
}

export interface MapLocationGroup {
  key: string;
  latitude: number;
  longitude: number;
  locationName: string;
  documents: DocumentRecord[];
}

/**
 * Validates that latitude and longitude are valid finite numbers within geographical boundaries.
 * Latitude must be within [-90, 90] and Longitude within [-180, 180].
 */
export function validateCoordinates(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }
  if (lat < -90 || lat > 90) {
    return false;
  }
  if (lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

/**
 * Formats decimal latitude and longitude into scholarly cardinal coordinates (e.g. "23.8593° N, 72.1017° E").
 */
export function formatCoordinateDisplay(lat: number, lng: number): string {
  const latCard = lat >= 0 ? 'N' : 'S';
  const lngCard = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latCard}, ${Math.abs(lng).toFixed(4)}° ${lngCard}`;
}

/**
 * Filters document records based on search query and actual database metadata attributes,
 * partitioning the results into mapped (valid coordinates) and unmapped records.
 */
export function filterMapRecords(
  records: DocumentRecord[],
  filters: MapFilters
): { mapped: DocumentRecord[]; unmapped: DocumentRecord[] } {
  const q = (filters.query || '').trim().toLowerCase();
  const docType = filters.documentType || 'all';
  const period = filters.historicalPeriod || 'all';
  const language = filters.language || 'all';
  const verification = filters.verificationStatus || 'all';

  const matching = records.filter((doc) => {
    // Document Type filter
    if (docType !== 'all' && doc.document_type !== docType) {
      return false;
    }

    // Historical Period filter
    if (period !== 'all' && doc.historical_period !== period) {
      return false;
    }

    // Language filter
    if (language !== 'all') {
      const docLang = (doc.language || '').toLowerCase();
      if (!docLang.includes(language.toLowerCase())) {
        return false;
      }
    }

    // Verification Status filter
    if (verification !== 'all' && doc.verification_status !== verification) {
      return false;
    }

    // Textual Search Query across actual metadata
    if (q) {
      const haystack = [
        doc.title,
        doc.description || '',
        doc.location_name || '',
        doc.historical_period || '',
        doc.language || '',
        doc.source_name || '',
        doc.attribution || '',
      ]
        .join(' ')
        .toLowerCase();

      const tokens = q.split(/\s+/).filter((t) => t.length > 0);
      const matchesAll = tokens.every((token) => haystack.includes(token));
      if (!matchesAll) {
        return false;
      }
    }

    return true;
  });

  const mapped: DocumentRecord[] = [];
  const unmapped: DocumentRecord[] = [];

  for (const doc of matching) {
    if (validateCoordinates(doc.latitude, doc.longitude)) {
      mapped.push(doc);
    } else {
      unmapped.push(doc);
    }
  }

  return { mapped, unmapped };
}

/**
 * Groups multiple document records sharing the exact or near-identical coordinates into a unified location cluster.
 * Prevents overlapping markers that cannot be selected and provides multi-record popups.
 */
export function groupRecordsByLocation(records: DocumentRecord[]): MapLocationGroup[] {
  const groupsMap = new Map<string, MapLocationGroup>();

  for (const doc of records) {
    if (!validateCoordinates(doc.latitude, doc.longitude)) {
      continue;
    }

    const lat = doc.latitude!;
    const lng = doc.longitude!;
    // Round to 4 decimal places (~11m precision) to cluster co-located records
    const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        latitude: lat,
        longitude: lng,
        locationName: doc.location_name || 'Heritage Location',
        documents: [],
      });
    }

    const group = groupsMap.get(key)!;
    group.documents.push(doc);
    if (!group.locationName || group.locationName === 'Heritage Location') {
      if (doc.location_name) {
        group.locationName = doc.location_name;
      }
    }
  }

  return Array.from(groupsMap.values());
}

/**
 * Computes bounding coordinates [[minLat, minLng], [maxLat, maxLng]] to fit all visible location markers.
 * Returns null if no groups exist.
 */
export function computeMapBounds(
  groups: MapLocationGroup[]
): [[number, number], [number, number]] | null {
  if (!groups || groups.length === 0) {
    return null;
  }

  if (groups.length === 1) {
    const lat = groups[0].latitude;
    const lng = groups[0].longitude;
    const delta = 0.05; // ~5km padding around single site
    return [
      [lat - delta, lng - delta],
      [lat + delta, lng + delta],
    ];
  }

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  for (const g of groups) {
    if (g.latitude < minLat) minLat = g.latitude;
    if (g.latitude > maxLat) maxLat = g.latitude;
    if (g.longitude < minLng) minLng = g.longitude;
    if (g.longitude > maxLng) maxLng = g.longitude;
  }

  // Add 10% breathing padding
  const latPad = Math.max(0.02, (maxLat - minLat) * 0.1);
  const lngPad = Math.max(0.02, (maxLng - minLng) * 0.1);

  return [
    [minLat - latPad, minLng - lngPad],
    [maxLat + latPad, maxLng + lngPad],
  ];
}
