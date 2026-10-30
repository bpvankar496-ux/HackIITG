/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DocumentType =
  | 'manuscript'
  | 'photograph'
  | 'map'
  | 'architectural_record'
  | 'historical_document'
  | 'epigraphical_record'
  | 'other';

export type ProcessingStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'needs_review'
  | 'indexed'
  | 'failed';

export type VerificationStatus =
  | 'unverified'
  | 'under_review'
  | 'verified'
  | 'peer_reviewed';

export interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  document_type: DocumentType;
  historical_period: string | null;
  language: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  source_name: string | null;
  attribution: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  processing_status: ProcessingStatus;
  verification_status: VerificationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentInsertInput {
  title: string;
  description?: string | null;
  document_type: DocumentType;
  historical_period?: string | null;
  language?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source_name?: string | null;
  attribution?: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  processing_status?: ProcessingStatus;
  verification_status?: VerificationStatus;
  created_by?: string | null;
}

export type ExtractionMethod =
  | 'pdf_text_layer'
  | 'gemini_multimodal_ocr'
  | 'empty_page_marker';

export type PageExtractionStatus =
  | 'completed'
  | 'empty_page'
  | 'failed'
  | 'needs_review';

export interface DocumentPageRecord {
  id: string;
  document_id: string;
  page_number: number;
  extracted_text: string;
  extraction_method: ExtractionMethod;
  extraction_status: PageExtractionStatus;
  confidence_score: number | null;
  word_count: number;
  detected_language: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentPageInsertInput {
  document_id: string;
  page_number: number;
  extracted_text: string;
  extraction_method: ExtractionMethod;
  extraction_status: PageExtractionStatus;
  confidence_score?: number | null;
  word_count?: number;
  detected_language?: string | null;
}
