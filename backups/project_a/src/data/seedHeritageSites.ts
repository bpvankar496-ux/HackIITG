import { HeritageSiteItem } from '../types/heritage';
import { AUTHENTIC_HERITAGE_DATASET } from './authenticHeritageDataset';

export type { HeritageSiteItem };

/**
 * Standard seed heritage collection for Virasat Quest.
 * Sourced directly from verified, authentic Indian heritage datasets (Step 10).
 */
export const SEED_HERITAGE_SITES: HeritageSiteItem[] = AUTHENTIC_HERITAGE_DATASET;
