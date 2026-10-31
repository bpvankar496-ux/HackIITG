/**
 * Comprehensive Schema for Authentic Heritage Records in Virasat  (Step 10)
 */

export type HeritageCategory =
  | 'Stepwells'
  | 'Forts'
  | 'Temples'
  | 'Architecture'
  | 'Folk Art'
  | 'Handicrafts'
  | 'Cultural Traditions'
  | 'Archaeological Sites'
  | 'Caves'
  | 'Monasteries';

export type UnescoStatus = 'World Heritage Site' | 'Tentative List' | 'None';

export type ProtectionCategory =
  | 'ASI National'
  | 'State Protected'
  | 'Municipal / Local'
  | 'Unprotected'
  | 'Not Documented';

export type SiteVerification = 'verified' | 'unverified' | 'community' | 'pending';

export interface HeritageMediaItem {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  license: string;
  source_url: string;
  is_hero?: boolean;
}

export interface HeritageSiteItem {
  id: string;
  slug: string;
  name: string;
  alternateNames?: string[];
  state: string;
  district?: string;
  locality?: string;
  lat?: number | null;
  lng?: number | null;
  category: HeritageCategory;
  period?: string;
  architecturalStyle?: string;
  unescoStatus?: UnescoStatus;
  designationYear?: number;
  protectionCategory?: ProtectionCategory;
  description: string;
  significance?: string;
  story?: string;
  source: string;
  source_url?: string;
  sourceOrganization?: string;
  dateVerified?: string;
  verification: 'verified' | 'unverified' | 'community';
  is_demo: boolean;
  model_url?: string;
  status: 'approved' | 'pending' | 'rejected';
  heritage_media?: HeritageMediaItem[];
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedRecord?: HeritageSiteItem;
}

export interface ImportBatchReport {
  totalProcessed: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ recordIdentifier: string; reason: string }>;
  timestamp: string;
}
