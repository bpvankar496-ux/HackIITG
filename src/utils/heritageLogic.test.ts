import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGpsDistance,
  isWithinGpsThreshold,
  filterHeritageSites,
  extractPassagesFromText,
  HeritageSiteItem,
} from './heritageLogic.ts';

test('calculateGpsDistance computes accurate distance between two coordinates', () => {
  // Distance from Rani ki Vav (23.8593, 72.1017) to a point ~100m away
  const d = calculateGpsDistance(23.8593, 72.1017, 23.8600, 72.1020);
  assert.ok(d > 0 && d < 200, `Expected distance ~80-120m, got ${d}`);
});

test('isWithinGpsThreshold validates geofenced proximity accurately', () => {
  // Within 300m
  const near = isWithinGpsThreshold(23.8593, 72.1017, 23.8595, 72.1019, 300);
  assert.equal(near.verified, true);
  assert.ok(near.distance <= 300);

  // Far away (Ahmedabad to Patan is > 100km)
  const far = isWithinGpsThreshold(23.0225, 72.5714, 23.8593, 72.1017, 300);
  assert.equal(far.verified, false);
  assert.ok(far.distance > 50000);
});

test('filterHeritageSites filters by query, category, and state', () => {
  const sampleSites: HeritageSiteItem[] = [
    {
      id: '1',
      slug: 'rani-ki-vav',
      name: 'Rani ki Vav',
      state: 'Gujarat',
      district: 'Patan',
      category: 'Stepwells',
      period: '11th century',
      verification: 'verified',
    },
    {
      id: '2',
      slug: 'konark-sun-temple',
      name: 'Konark Sun Temple',
      state: 'Odisha',
      district: 'Puri',
      category: 'Temples',
      period: '13th century',
      verification: 'verified',
    },
  ];

  // Search by query
  const res1 = filterHeritageSites(sampleSites, { query: 'Patan' });
  assert.equal(res1.length, 1);
  assert.equal(res1[0].slug, 'rani-ki-vav');

  // Filter by category
  const res2 = filterHeritageSites(sampleSites, { category: 'Temples' });
  assert.equal(res2.length, 1);
  assert.equal(res2[0].slug, 'konark-sun-temple');

  // Filter by non-matching state
  const res3 = filterHeritageSites(sampleSites, { state: 'Rajasthan' });
  assert.equal(res3.length, 0);
});

test('extractPassagesFromText chunks multi-page OCR document text into indexed passages', () => {
  const sampleOcr = `
[Page 1]
This is an authentic colonial survey report on the architectural remains of Patan and Modhera.
The stepwell exhibits elaborate sculptures of Vishnu incarnations across seven subterranean terraces.

[Page 2]
The Sun Temple at Modhera was constructed under the reign of King Bhima I of the Chaulukya dynasty.
The Surya Kund water tank features 108 miniature shrines along the stepped embankment.
`;

  const passages = extractPassagesFromText(sampleOcr, 30);
  assert.equal(passages.length, 2);
  assert.equal(passages[0].pageNumber, 1);
  assert.ok(passages[0].text.includes('Rani') || passages[0].text.includes('Patan'));
  assert.equal(passages[1].pageNumber, 2);
  assert.ok(passages[1].text.includes('Modhera'));
});
