import {
  HeritageSiteItem,
  ImportValidationResult,
  ImportBatchReport,
  HeritageCategory,
  UnescoStatus,
  ProtectionCategory
} from '../types/heritage';

export const VALID_HERITAGE_CATEGORIES: HeritageCategory[] = [
  'Stepwells',
  'Forts',
  'Temples',
  'Architecture',
  'Folk Art',
  'Handicrafts',
  'Cultural Traditions',
  'Archaeological Sites',
  'Caves',
  'Monasteries'
];

export const VALID_UNESCO_STATUSES: UnescoStatus[] = [
  'World Heritage Site',
  'Tentative List',
  'None'
];

export const VALID_PROTECTION_CATEGORIES: ProtectionCategory[] = [
  'ASI National',
  'State Protected',
  'Municipal / Local',
  'Unprotected',
  'Not Documented'
];

/**
 * Normalizes a site name into a URL-friendly slug.
 */
export function normalizeSiteSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Validates an individual heritage record against data integrity standards.
 */
export function validateHeritageRecord(raw: Partial<HeritageSiteItem>): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw.name || typeof raw.name !== 'string' || !raw.name.trim()) {
    errors.push('Site name is required.');
  }

  if (!raw.state || typeof raw.state !== 'string' || !raw.state.trim()) {
    errors.push('State location is required.');
  }

  if (!raw.category || !VALID_HERITAGE_CATEGORIES.includes(raw.category as HeritageCategory)) {
    errors.push(
      `Invalid category "${raw.category}". Allowed: ${VALID_HERITAGE_CATEGORIES.join(', ')}.`
    );
  }

  if (!raw.description || typeof raw.description !== 'string' || raw.description.trim().length < 15) {
    errors.push('A substantive factual description (at least 15 characters) is required.');
  }

  if (!raw.source || typeof raw.source !== 'string' || !raw.source.trim()) {
    errors.push('Authoritative source citation is required.');
  }

  // Validate coordinates if provided
  let lat: number | null = null;
  let lng: number | null = null;

  if (raw.lat !== undefined && raw.lat !== null) {
    const parsedLat = Number(raw.lat);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.push(`Latitude "${raw.lat}" must be a valid number between -90 and 90.`);
    } else {
      lat = parsedLat;
    }
  }

  if (raw.lng !== undefined && raw.lng !== null) {
    const parsedLng = Number(raw.lng);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.push(`Longitude "${raw.lng}" must be a valid number between -180 and 180.`);
    } else {
      lng = parsedLng;
    }
  }

  if ((lat === null && lng !== null) || (lat !== null && lng === null)) {
    warnings.push('Only one coordinate axis provided; both latitude and longitude should be present or both omitted.');
  }

  // Validate UNESCO status
  const unescoStatus = raw.unescoStatus ?? 'None';
  if (!VALID_UNESCO_STATUSES.includes(unescoStatus)) {
    warnings.push(`Unrecognized UNESCO status "${unescoStatus}", defaulting to "None".`);
  }

  // Validate protection category
  const protectionCategory = raw.protectionCategory ?? 'Not Documented';
  if (!VALID_PROTECTION_CATEGORIES.includes(protectionCategory)) {
    warnings.push(`Unrecognized protection category "${protectionCategory}", defaulting to "Not Documented".`);
  }

  if (raw.unescoStatus === 'World Heritage Site' && !raw.designationYear) {
    warnings.push('World Heritage designation year is recommended when UNESCO status is World Heritage Site.');
  }

  const slug = raw.slug?.trim() || (raw.name ? normalizeSiteSlug(raw.name) : '');
  const id = raw.id?.trim() || `site-${slug || Date.now()}`;

  const sanitizedRecord: HeritageSiteItem = {
    id,
    slug,
    name: raw.name?.trim() || '',
    alternateNames: Array.isArray(raw.alternateNames)
      ? raw.alternateNames.filter(Boolean).map(a => a.trim())
      : [],
    state: raw.state?.trim() || '',
    district: raw.district?.trim() || undefined,
    locality: raw.locality?.trim() || undefined,
    lat,
    lng,
    category: (raw.category as HeritageCategory) || 'Architecture',
    period: raw.period?.trim() || undefined,
    architecturalStyle: raw.architecturalStyle?.trim() || undefined,
    unescoStatus: VALID_UNESCO_STATUSES.includes(unescoStatus) ? unescoStatus : 'None',
    designationYear: raw.designationYear ? Number(raw.designationYear) : undefined,
    protectionCategory: VALID_PROTECTION_CATEGORIES.includes(protectionCategory)
      ? protectionCategory
      : 'Not Documented',
    description: raw.description?.trim() || '',
    significance: raw.significance?.trim() || undefined,
    story: raw.story?.trim() || undefined,
    source: raw.source?.trim() || 'Authoritative Archive',
    source_url: raw.source_url?.trim() || undefined,
    sourceOrganization: raw.sourceOrganization?.trim() || undefined,
    dateVerified: raw.dateVerified?.trim() || new Date().toISOString().split('T')[0],
    verification: raw.verification === 'verified' ? 'verified' : raw.verification === 'community' ? 'community' : 'unverified',
    is_demo: Boolean(raw.is_demo ?? true),
    status: raw.status || 'approved',
    model_url: raw.model_url,
    heritage_media: Array.isArray(raw.heritage_media) ? raw.heritage_media : []
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedRecord: errors.length === 0 ? sanitizedRecord : undefined
  };
}

/**
 * Idempotently merges incoming heritage records into an existing dataset.
 * - Deduplicates by slug or canonical ID.
 * - Updates existing entries if incoming has higher verification or more comprehensive data.
 * - Preserves user-contributed records.
 * - Produces an audit log with counts of processed, imported, updated, skipped, and failed.
 */
export function importHeritageBatch(
  existingSites: HeritageSiteItem[],
  incomingBatch: Partial<HeritageSiteItem>[],
  options: { updateExisting?: boolean; preserveUserSubmissions?: boolean } = {}
): { updatedSites: HeritageSiteItem[]; report: ImportBatchReport } {
  const { updateExisting = true, preserveUserSubmissions = true } = options;

  const siteMap = new Map<string, HeritageSiteItem>();
  const slugIndex = new Map<string, string>(); // slug -> id

  // Populate map with existing sites
  for (const site of existingSites) {
    siteMap.set(site.id, site);
    slugIndex.set(site.slug.toLowerCase(), site.id);
  }

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: Array<{ recordIdentifier: string; reason: string }> = [];

  for (const raw of incomingBatch) {
    const identifier = raw.name || raw.slug || raw.id || 'unnamed-record';
    const validation = validateHeritageRecord(raw);

    if (!validation.isValid || !validation.sanitizedRecord) {
      failedCount++;
      errors.push({
        recordIdentifier: identifier,
        reason: validation.errors.join('; ')
      });
      continue;
    }

    const record = validation.sanitizedRecord;
    const existingById = siteMap.get(record.id);
    const existingBySlug = slugIndex.has(record.slug.toLowerCase())
      ? siteMap.get(slugIndex.get(record.slug.toLowerCase())!)
      : undefined;

    const existingMatch = existingById || existingBySlug;

    if (!existingMatch) {
      // Clean new import
      siteMap.set(record.id, record);
      slugIndex.set(record.slug.toLowerCase(), record.id);
      importedCount++;
    } else {
      // Record already exists
      if (preserveUserSubmissions && existingMatch.verification === 'community') {
        skippedCount++;
        continue;
      }

      if (updateExisting) {
        // Merge fields, retaining existing media if incoming has none
        const merged: HeritageSiteItem = {
          ...existingMatch,
          ...record,
          id: existingMatch.id, // Preserve canonical ID
          heritage_media:
            record.heritage_media && record.heritage_media.length > 0
              ? record.heritage_media
              : existingMatch.heritage_media
        };
        siteMap.set(existingMatch.id, merged);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  const updatedSites = Array.from(siteMap.values());

  const report: ImportBatchReport = {
    totalProcessed: incomingBatch.length,
    importedCount,
    updatedCount,
    skippedCount,
    failedCount,
    errors,
    timestamp: new Date().toISOString()
  };

  return { updatedSites, report };
}
