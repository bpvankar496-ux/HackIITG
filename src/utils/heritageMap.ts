/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DocumentRecord, DocumentType, VerificationStatus } from '../types/database.types.ts';
import type { HeritageSiteItem } from '../types/heritage.ts';
import { calculateGpsDistance } from './heritageLogic.ts';

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
 * Joins a document to a monument only when its own metadata names that site and
 * its recorded coordinates are within 100 m. The document coordinates remain
 * untouched; this is a display relationship, not a coordinate correction.
 */
export function isDocumentAtHeritageSite(
  document: Pick<DocumentRecord, 'title' | 'description' | 'location_name' | 'latitude' | 'longitude'>,
  site: HeritageSiteItem,
  maxDistanceMeters: number = 100
): boolean {
  if (!validateCoordinates(document.latitude, document.longitude) || !validateCoordinates(site.lat, site.lng)) {
    return false;
  }

  const distanceMeters = calculateGpsDistance(
    document.latitude!,
    document.longitude!,
    site.lat!,
    site.lng!
  );
  if (distanceMeters === 0) return true;
  if (distanceMeters > maxDistanceMeters) return false;

  const documentText = [document.title, document.description, document.location_name]
    .filter(Boolean)
    .join(' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
  const documentTokens = new Set(documentText.split(/[^\p{L}\p{N}]+/u));
  const siteNames = [site.name, ...(site.alternateNames || [])];

  return siteNames.some((name) => {
    const tokens = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length >= 3);
    return tokens.length > 0 && tokens.every((token) => documentTokens.has(token));
  });
}

/** Explains exactly why a record cannot be plotted without guessing its location. */
export function getCoordinateIssueReason(lat: unknown, lng: unknown): string {
  const missingLatitude = lat === null || lat === undefined || lat === '';
  const missingLongitude = lng === null || lng === undefined || lng === '';

  if (missingLatitude && missingLongitude) return 'Latitude and longitude are missing.';
  if (missingLatitude) return 'Latitude is missing.';
  if (missingLongitude) return 'Longitude is missing.';

  const invalidLatitude =
    typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90;
  const invalidLongitude =
    typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180;

  if (invalidLatitude && invalidLongitude) return 'Latitude and longitude are invalid.';
  if (invalidLatitude) return 'Latitude is invalid (expected -90 to 90).';
  if (invalidLongitude) return 'Longitude is invalid (expected -180 to 180).';
  return 'Coordinates are valid.';
}

/** Groups projected map points that would overlap at the current zoom level. */
export function clusterProjectedPoints<T extends { x: number; y: number }>(
  points: T[],
  radiusPx: number = 44
): T[][] {
  const parents = points.map((_, index) => index);
  const find = (index: number): number => {
    if (parents[index] !== index) parents[index] = find(parents[index]);
    return parents[index];
  };
  const join = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  const threshold = radiusPx * radiusPx;

  for (let left = 0; left < points.length; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      const dx = points[left].x - points[right].x;
      const dy = points[left].y - points[right].y;
      if (dx * dx + dy * dy <= threshold) join(left, right);
    }
  }

  const groups = new Map<number, T[]>();
  points.forEach((point, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) || []), point]);
  });
  return Array.from(groups.values());
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
