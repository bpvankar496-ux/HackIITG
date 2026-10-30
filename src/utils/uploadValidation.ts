/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number];

export const VALID_DOCUMENT_TYPES = [
  'manuscript',
  'photograph',
  'map',
  'architectural_record',
  'historical_document',
  'other',
] as const;

export type DocumentTypeEnum = typeof VALID_DOCUMENT_TYPES[number];

export interface FileValidationInput {
  name: string;
  size: number;
  type: string;
}

/**
 * Validates file size, non-empty content, and MIME type / extension.
 */
export function validateUploadFile(file: FileValidationInput): {
  valid: boolean;
  error?: string;
  mimeType?: SupportedMimeType;
} {
  if (!file) {
    return { valid: false, error: 'No file provided for upload.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'The selected file is empty (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 20 MB.`,
    };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file extension ".${extension}". Supported formats: PDF, JPEG, PNG.`,
    };
  }

  let normalizedMime: SupportedMimeType | undefined;
  if (extension === 'pdf' && (file.type === 'application/pdf' || !file.type)) {
    normalizedMime = 'application/pdf';
  } else if (
    (extension === 'jpg' || extension === 'jpeg') &&
    (file.type === 'image/jpeg' || file.type === 'image/pjpeg' || !file.type)
  ) {
    normalizedMime = 'image/jpeg';
  } else if (extension === 'png' && (file.type === 'image/png' || !file.type)) {
    normalizedMime = 'image/png';
  } else if (SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
    normalizedMime = file.type as SupportedMimeType;
  }

  if (!normalizedMime) {
    return {
      valid: false,
      error: `MIME type "${file.type}" does not match file extension ".${extension}".`,
    };
  }

  return { valid: true, mimeType: normalizedMime };
}

export interface DocumentMetadataInput {
  title: string;
  document_type: string;
  description?: string;
  historical_period?: string;
  language?: string;
  location_name?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  source_name?: string;
  attribution?: string;
}

/**
 * Validates document metadata before database insertion.
 */
export function validateDocumentMetadata(input: DocumentMetadataInput): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized: {
    title: string;
    document_type: DocumentTypeEnum;
    description: string | null;
    historical_period: string | null;
    language: string | null;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
    source_name: string | null;
    attribution: string | null;
  };
} {
  const errors: Record<string, string> = {};

  const title = (input.title || '').trim();
  if (!title) {
    errors.title = 'Document title is required.';
  } else if (title.length > 255) {
    errors.title = 'Document title must not exceed 255 characters.';
  }

  const docType = input.document_type as DocumentTypeEnum;
  if (!VALID_DOCUMENT_TYPES.includes(docType)) {
    errors.document_type = `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`;
  }

  let latNum: number | null = null;
  if (input.latitude !== undefined && input.latitude !== null && input.latitude !== '') {
    const parsed = Number(input.latitude);
    if (isNaN(parsed) || parsed < -90 || parsed > 90) {
      errors.latitude = 'Latitude must be a valid number between -90 and 90.';
    } else {
      latNum = parsed;
    }
  }

  let lngNum: number | null = null;
  if (input.longitude !== undefined && input.longitude !== null && input.longitude !== '') {
    const parsed = Number(input.longitude);
    if (isNaN(parsed) || parsed < -180 || parsed > 180) {
      errors.longitude = 'Longitude must be a valid number between -180 and 180.';
    } else {
      lngNum = parsed;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      title,
      document_type: docType,
      description: (input.description || '').trim() || null,
      historical_period: (input.historical_period || '').trim() || null,
      language: (input.language || '').trim() || null,
      location_name: (input.location_name || '').trim() || null,
      latitude: latNum,
      longitude: lngNum,
      source_name: (input.source_name || '').trim() || null,
      attribution: (input.attribution || '').trim() || null,
    },
  };
}

/**
 * Generates a collision-resistant, sanitized storage path.
 */
export function generateStoragePath(
  userId: string | null,
  originalFilename: string
): string {
  const sanitizedName = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .slice(0, 80);
  const userPrefix = userId ? userId.replace(/[^a-zA-Z0-9-]/g, '') : 'vault';
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${userPrefix}/${timestamp}-${randomSuffix}-${sanitizedName}`;
}

/**
 * Formats byte counts into human-readable strings.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
