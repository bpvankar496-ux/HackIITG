/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HeritageCategory =
  | 'Stepwells'
  | 'Forts'
  | 'Temples'
  | 'Architecture'
  | 'Folk Art'
  | 'Handicrafts'
  | 'Cultural Traditions';

export interface HeritageMedia {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  license: string;
  source_url: string;
  is_hero?: boolean;
}

export interface HeritageSite {
  id: string;
  slug: string;
  name: string;
  state: string;
  district?: string | null;
  lat: number;
  lng: number;
  category: HeritageCategory;
  period?: string | null;
  description: string;
  story?: string | null;
  language?: string;
  source?: string | null;
  verification: 'verified' | 'unverified' | 'community';
  is_demo?: boolean;
  model_url?: string | null;
  media: HeritageMedia[];
  related_document_ids?: string[];
}

export interface DocumentPassage {
  id: string;
  document_id: string;
  page_number: number;
  passage_text: string;
  key_entities: string[];
  translation?: string;
}

export interface ArchivalDocument {
  id: string;
  slug: string;
  title: string;
  author_or_creator: string;
  document_type: 'manuscript' | 'gazetteer' | 'survey_report' | 'inscription' | 'field_notes';
  period_date: string;
  original_language: string;
  source_archive: string;
  license: string;
  original_scan_url: string;
  transcription_status: 'verified' | 'ocr_extracted' | 'pending';
  total_pages: number;
  passages: DocumentPassage[];
  related_site_slugs: string[];
  summary: string;
  historical_context: string;
  created_at: string;
}

export interface QuestStep {
  id: string;
  position: number;
  site_slug: string;
  story_intro: string;
  clue: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  points: number;
}

export interface Quest {
  id: string;
  slug: string;
  title: string;
  intro: string;
  steps: QuestStep[];
}

export interface CommunitySubmission {
  id: string;
  name: string;
  state: string;
  district?: string;
  category: HeritageCategory;
  period?: string;
  description: string;
  source?: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_correction';
  reviewer_note?: string;
  created_at: string;
}
