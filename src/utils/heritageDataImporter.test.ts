import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateHeritageRecord,
  normalizeSiteSlug,
  importHeritageBatch
} from './heritageDataImporter';
import { AUTHENTIC_HERITAGE_DATASET } from '../data/authenticHeritageDataset';
import { HeritageSiteItem } from '../types/heritage';

describe('Heritage Data Importer & Validation Engine', () => {
  it('should normalize site names into valid URL-friendly slugs', () => {
    assert.strictEqual(normalizeSiteSlug('Rani ki Vav'), 'rani-ki-vav');
    assert.strictEqual(normalizeSiteSlug('Champaner-Pavagadh Archaeological Park!'), 'champaner-pavagadh-archaeological-park');
    assert.strictEqual(normalizeSiteSlug('  Dholavira: A Harappan City  '), 'dholavira-a-harappan-city');
    assert.strictEqual(normalizeSiteSlug('Brihadisvara & Thanjavur'), 'brihadisvara-thanjavur');
  });

  it('should validate all 38 authentic heritage records with zero errors', () => {
    let validCount = 0;
    const allErrors: string[] = [];

    for (const record of AUTHENTIC_HERITAGE_DATASET) {
      const res = validateHeritageRecord(record);
      if (!res.isValid) {
        allErrors.push(`${record.name}: ${res.errors.join(', ')}`);
      } else {
        validCount++;
      }
    }

    assert.strictEqual(allErrors.length, 0, `Validation errors found: ${allErrors.join('; ')}`);
    assert.strictEqual(validCount, AUTHENTIC_HERITAGE_DATASET.length);
    assert.ok(validCount >= 30, 'Dataset contains at least 30 authentic heritage records');
  });

  it('should fail validation when required fields are missing', () => {
    const invalidSite: Partial<HeritageSiteItem> = {
      name: '',
      state: 'Gujarat',
      category: 'Stepwells',
      description: 'Short',
      source: ''
    };

    const res = validateHeritageRecord(invalidSite);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Site name is required')));
    assert.ok(res.errors.some(e => e.includes('substantive factual description')));
    assert.ok(res.errors.some(e => e.includes('Authoritative source citation')));
  });

  it('should detect invalid coordinates out of range', () => {
    const invalidCoords: Partial<HeritageSiteItem> = {
      name: 'Test Monument',
      state: 'Gujarat',
      category: 'Forts',
      description: 'A genuine historical fort located within Gujarat state.',
      source: 'Archaeological Survey of India',
      lat: 105.4, // invalid latitude > 90
      lng: 72.1
    };

    const res = validateHeritageRecord(invalidCoords);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Latitude "105.4" must be a valid number between -90 and 90')));
  });

  it('should detect invalid category', () => {
    const invalidCat: Partial<HeritageSiteItem> = {
      name: 'Test Monument',
      state: 'Gujarat',
      category: 'ModernSkyscraper' as any,
      description: 'A genuine historical fort located within Gujarat state.',
      source: 'Archaeological Survey of India'
    };

    const res = validateHeritageRecord(invalidCat);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Invalid category')));
  });

  it('should idempotently import records and report exact counts', () => {
    const initialSites: HeritageSiteItem[] = [
      {
        id: 'site-rkv',
        slug: 'rani-ki-vav',
        name: 'Rani ki Vav',
        state: 'Gujarat',
        category: 'Stepwells',
        description: 'Original baseline description for Rani ki Vav stepwell.',
        source: 'UNESCO World Heritage List',
        verification: 'verified',
        is_demo: true,
        status: 'approved'
      }
    ];

    const incoming = [
      // 1. Updated version of existing site
      {
        id: 'site-rkv',
        slug: 'rani-ki-vav',
        name: 'Rani ki Vav (Queen’s Stepwell)',
        state: 'Gujarat',
        district: 'Patan',
        lat: 23.8593,
        lng: 72.1017,
        category: 'Stepwells' as const,
        description: 'Updated comprehensive description of the subterranean stepwell.',
        source: 'UNESCO World Heritage Dossier No. 922',
        verification: 'verified' as const,
        is_demo: true,
        status: 'approved' as const
      },
      // 2. Brand new site
      {
        id: 'site-taj',
        slug: 'taj-mahal',
        name: 'Taj Mahal',
        state: 'Uttar Pradesh',
        category: 'Architecture' as const,
        description: 'Mughal white marble mausoleum commissioned by Shah Jahan in Agra.',
        source: 'UNESCO World Heritage List Ref: 252',
        verification: 'verified' as const,
        is_demo: true,
        status: 'approved' as const
      },
      // 3. Invalid record
      {
        name: '',
        state: 'Unknown',
        category: 'Temples' as const,
        description: 'Invalid record missing name.',
        source: 'None'
      }
    ];

    const result = importHeritageBatch(initialSites, incoming, { updateExisting: true });

    assert.strictEqual(result.report.totalProcessed, 3);
    assert.strictEqual(result.report.importedCount, 1, 'Imported 1 new site');
    assert.strictEqual(result.report.updatedCount, 1, 'Updated 1 existing site');
    assert.strictEqual(result.report.failedCount, 1, 'Failed 1 invalid record');
    assert.strictEqual(result.updatedSites.length, 2, 'Final dataset contains 2 sites');

    // Confirm updated site retained canonical ID and merged new fields
    const rkv = result.updatedSites.find(s => s.id === 'site-rkv');
    assert.ok(rkv);
    assert.strictEqual(rkv?.district, 'Patan');
    assert.strictEqual(rkv?.lat, 23.8593);
  });

  it('should preserve community-submitted records if requested', () => {
    const communitySite: HeritageSiteItem = {
      id: 'site-community-1',
      slug: 'local-stepwell',
      name: 'Local Stepwell',
      state: 'Gujarat',
      category: 'Stepwells',
      description: 'Documented by village youth group in Junagadh.',
      source: 'Oral History',
      verification: 'community',
      is_demo: false,
      status: 'pending'
    };

    const incomingOverwrite = [
      {
        id: 'site-community-1',
        slug: 'local-stepwell',
        name: 'Overwritten Stepwell',
        state: 'Gujarat',
        category: 'Stepwells' as const,
        description: 'Attempting to overwrite community contribution with new data.',
        source: 'External Source'
      }
    ];

    const result = importHeritageBatch([communitySite], incomingOverwrite, {
      preserveUserSubmissions: true
    });

    assert.strictEqual(result.report.skippedCount, 1);
    const retained = result.updatedSites.find(s => s.id === 'site-community-1');
    assert.strictEqual(retained?.name, 'Local Stepwell');
    assert.strictEqual(retained?.verification, 'community');
  });
});
