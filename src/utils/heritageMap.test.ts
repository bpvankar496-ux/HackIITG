/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  validateCoordinates,
  formatCoordinateDisplay,
  filterMapRecords,
  groupRecordsByLocation,
  computeMapBounds,
  getCoordinateIssueReason,
  clusterProjectedPoints,
  isDocumentAtHeritageSite,
} from './heritageMap.ts';
import type { DocumentRecord } from '../types/database.types.ts';
import { SEED_HERITAGE_SITES } from '../data/seedHeritageSites.ts';

const mockRecords: DocumentRecord[] = [
  {
    id: 'doc-patan-survey',
    title: 'Report on Antiquities of Kathiawad and Kachh',
    description: 'Colonial survey covering Rani ki Vav in Patan.',
    document_type: 'architectural_record',
    historical_period: '1876 CE',
    language: 'English with Sanskrit transcriptions',
    location_name: 'Patan, Gujarat',
    latitude: 23.8593,
    longitude: 72.1017,
    source_name: 'Archaeological Survey of Western India',
    attribution: 'Dr. James Burgess',
    storage_path: 'vault/burgess.pdf',
    original_filename: 'burgess.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 451,
    processing_status: 'completed',
    verification_status: 'peer_reviewed',
    created_by: null,
    created_at: '2026-10-28T18:24:54.426Z',
    updated_at: '2026-10-28T18:43:20.930Z',
  },
  {
    id: 'doc-patan-epigraph',
    title: 'Chaulukya Royal Epigraph: Patan Charter',
    description: 'Sanskrit stone charter recording King Bhima I and Queen Udayamati.',
    document_type: 'epigraphical_record',
    historical_period: '11th Century CE',
    language: 'Sanskrit in Devanagari script',
    location_name: 'Patan, Gujarat',
    latitude: 23.8593,
    longitude: 72.1017,
    source_name: 'Epigraphia Indica',
    attribution: 'ASI Epigraphy Branch',
    storage_path: 'vault/epigraph.pdf',
    original_filename: 'epigraph.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 782,
    processing_status: 'completed',
    verification_status: 'peer_reviewed',
    created_by: null,
    created_at: '2026-10-28T19:00:00.000Z',
    updated_at: '2026-10-28T19:00:00.000Z',
  },
  {
    id: 'doc-modhera-survey',
    title: 'Architectural Survey of the Sun Temple at Modhera',
    description: 'Documenting the 1026 CE Surya Temple and Surya Kund.',
    document_type: 'architectural_record',
    historical_period: '1886 CE',
    language: 'English with Gujarati notes',
    location_name: 'Modhera, Mehsana District, Gujarat',
    latitude: 23.5835,
    longitude: 72.1331,
    source_name: 'Archaeological Survey of Western India',
    attribution: 'Dr. James Burgess & Henry Cousens',
    storage_path: 'vault/modhera.pdf',
    original_filename: 'modhera.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 612,
    processing_status: 'completed',
    verification_status: 'peer_reviewed',
    created_by: null,
    created_at: '2026-10-28T19:10:00.000Z',
    updated_at: '2026-10-28T19:10:00.000Z',
  },
  {
    id: 'doc-merutunga-chronicle',
    title: 'Prabandha-Chintamani Manuscript of Merutunga',
    description: 'Historical chronicle of the Chaulukya kings. Unlocalized archival manuscript without geographic coordinates.',
    document_type: 'manuscript',
    historical_period: '1304 CE',
    language: 'Sanskrit with Old Gujarati glosses',
    location_name: 'Regional Historical Collection',
    latitude: null,
    longitude: null,
    source_name: 'Oriental Institute',
    attribution: 'Merutunga Acharya',
    storage_path: 'vault/merutunga.pdf',
    original_filename: 'merutunga.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 540,
    processing_status: 'completed',
    verification_status: 'under_review',
    created_by: null,
    created_at: '2026-10-28T19:15:00.000Z',
    updated_at: '2026-10-28T19:15:00.000Z',
  },
];

describe('Heritage Map Pure Logic Tests', () => {
  test('validateCoordinates accepts valid GPS coordinates and rejects invalid inputs', () => {
    // Valid coordinates
    assert.strictEqual(validateCoordinates(23.8593, 72.1017), true);
    assert.strictEqual(validateCoordinates(0, 0), true);
    assert.strictEqual(validateCoordinates(-33.8688, 151.2093), true);
    assert.strictEqual(validateCoordinates(90, 180), true);
    assert.strictEqual(validateCoordinates(-90, -180), true);

    // Out of range coordinates
    assert.strictEqual(validateCoordinates(90.1, 72.0), false);
    assert.strictEqual(validateCoordinates(-91.0, 72.0), false);
    assert.strictEqual(validateCoordinates(23.0, 180.5), false);
    assert.strictEqual(validateCoordinates(23.0, -181.0), false);

    // Non-numerical or invalid values
    assert.strictEqual(validateCoordinates(null, 72.0), false);
    assert.strictEqual(validateCoordinates(23.0, undefined), false);
    assert.strictEqual(validateCoordinates('23.8593', '72.1017'), false);
    assert.strictEqual(validateCoordinates(NaN, 72.0), false);
    assert.strictEqual(validateCoordinates(23.0, Infinity), false);
  });

  test('formatCoordinateDisplay produces readable cardinal notations', () => {
    const formatted = formatCoordinateDisplay(23.8593, 72.1017);
    assert.strictEqual(formatted, '23.8593° N, 72.1017° E');

    const southernHemisphere = formatCoordinateDisplay(-33.8688, -70.6483);
    assert.strictEqual(southernHemisphere, '33.8688° S, 70.6483° W');
  });

  test('getCoordinateIssueReason distinguishes missing and invalid coordinates', () => {
    assert.strictEqual(getCoordinateIssueReason(null, null), 'Latitude and longitude are missing.');
    assert.strictEqual(getCoordinateIssueReason(undefined, 72), 'Latitude is missing.');
    assert.strictEqual(getCoordinateIssueReason(23, undefined), 'Longitude is missing.');
    assert.strictEqual(getCoordinateIssueReason(91, 72), 'Latitude is invalid (expected -90 to 90).');
    assert.strictEqual(getCoordinateIssueReason(23, 181), 'Longitude is invalid (expected -180 to 180).');
  });

  test('clusterProjectedPoints groups overlapping markers and keeps distant markers selectable', () => {
    const groups = clusterProjectedPoints([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 20, y: 10 },
      { id: 'c', x: 300, y: 300 },
    ], 44);
    assert.strictEqual(groups.length, 2);
    assert.deepStrictEqual(groups.map((group) => group.map((point) => point.id)), [['a', 'b'], ['c']]);
  });

  test('the canonical heritage dataset is fully map-ready with unique coordinates and attributed media', () => {
    assert.strictEqual(SEED_HERITAGE_SITES.length, 42);
    assert.ok(SEED_HERITAGE_SITES.every((site) => site.verification === 'verified'));
    assert.ok(SEED_HERITAGE_SITES.every((site) => validateCoordinates(site.lat, site.lng)));
    assert.ok(SEED_HERITAGE_SITES.every((site) => Boolean(site.heritage_media?.[0]?.source_url && site.heritage_media[0].alt)));

    const coordinatePairs = SEED_HERITAGE_SITES.map((site) => `${site.lat},${site.lng}`);
    assert.strictEqual(new Set(coordinatePairs).size, SEED_HERITAGE_SITES.length);
  });

  test('links a nearby document to a monument only when its metadata names that site', () => {
    const modhera = SEED_HERITAGE_SITES.find((site) => site.slug === 'modhera-sun-temple');
    const rani = SEED_HERITAGE_SITES.find((site) => site.slug === 'rani-ki-vav');
    assert.ok(modhera && rani);
    assert.strictEqual(isDocumentAtHeritageSite(mockRecords[2], modhera), true);
    assert.strictEqual(isDocumentAtHeritageSite({ ...mockRecords[2], title: 'Unrelated record', description: 'Unrelated text', location_name: 'Other location' }, modhera), false);
    assert.strictEqual(isDocumentAtHeritageSite(mockRecords[3], rani), false);
    assert.strictEqual(mockRecords[2].longitude, 72.1331);
  });

  test('filterMapRecords separates mapped from unmapped records without guessing coordinates', () => {
    const result = filterMapRecords(mockRecords, {});

    // Mapped records must have coordinates
    assert.strictEqual(result.mapped.length, 3);
    assert.strictEqual(result.unmapped.length, 1);
    assert.strictEqual(result.unmapped[0].id, 'doc-merutunga-chronicle');
    assert.strictEqual(result.unmapped[0].latitude, null);
  });

  test('filterMapRecords filters by textual search query', () => {
    const result = filterMapRecords(mockRecords, { query: 'Modhera' });
    assert.strictEqual(result.mapped.length, 1);
    assert.strictEqual(result.mapped[0].id, 'doc-modhera-survey');
  });

  test('filterMapRecords filters by documentType and historicalPeriod', () => {
    const result = filterMapRecords(mockRecords, {
      documentType: 'epigraphical_record',
      historicalPeriod: '11th Century CE',
    });
    assert.strictEqual(result.mapped.length, 1);
    assert.strictEqual(result.mapped[0].id, 'doc-patan-epigraph');
  });

  test('groupRecordsByLocation groups multiple documents at identical coordinates', () => {
    const { mapped } = filterMapRecords(mockRecords, {});
    const groups = groupRecordsByLocation(mapped);

    // Patan has 2 documents at 23.8593, 72.1017; Modhera has 1
    assert.strictEqual(groups.length, 2);

    const patanGroup = groups.find((g) => g.locationName.includes('Patan'));
    assert.ok(patanGroup);
    assert.strictEqual(patanGroup.documents.length, 2);
    assert.strictEqual(patanGroup.latitude, 23.8593);
    assert.strictEqual(patanGroup.longitude, 72.1017);

    const modheraGroup = groups.find((g) => g.locationName.includes('Modhera'));
    assert.ok(modheraGroup);
    assert.strictEqual(modheraGroup.documents.length, 1);
    assert.strictEqual(modheraGroup.latitude, 23.5835);
  });

  test('computeMapBounds calculates appropriate geographical bounding boxes', () => {
    const { mapped } = filterMapRecords(mockRecords, {});
    const groups = groupRecordsByLocation(mapped);

    const bounds = computeMapBounds(groups);
    assert.ok(bounds);
    const [[minLat, minLng], [maxLat, maxLng]] = bounds;

    // Both Patan (23.8593) and Modhera (23.5835) must fall within bounds
    assert.ok(minLat <= 23.5835);
    assert.ok(maxLat >= 23.8593);
    assert.ok(minLng <= 72.1017);
    assert.ok(maxLng >= 72.1331);

    // Empty array must return null
    assert.strictEqual(computeMapBounds([]), null);
  });
});
