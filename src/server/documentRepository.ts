/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServiceSupabaseClient as getSupabaseServiceClient } from '../lib/supabaseAdmin.ts';
import fs from 'fs';
import path from 'path';
import {
  validateUploadFile,
  validateDocumentMetadata,
  generateStoragePath,
  DocumentMetadataInput,
} from '../utils/uploadValidation.ts';
import type {
  DocumentRecord,
  DocumentPageRecord,
  DocumentPageInsertInput,
  ProcessingStatus,
} from '../types/database.types.ts';

const LOCAL_VAULT_FILE = path.resolve(process.cwd(), 'data/documents_vault.json');
const LOCAL_PAGES_VAULT_FILE = path.resolve(process.cwd(), 'data/document_pages_vault.json');

export interface SourceAssetAvailability {
  available: boolean;
  reason?: 'missing' | 'storage_unavailable';
}

function isMissingStorageObject(error: { message?: string } | null | undefined): boolean {
  // Do not treat every "not found" response as a missing document. For example,
  // a missing/misconfigured bucket also returns a not-found style message and
  // should remain distinguishable from a record whose source binary is absent.
  return /object not found/i.test(error?.message || '');
}

// Ensure local vault directory exists
function ensureLocalVaultDir() {
  const dir = path.dirname(LOCAL_VAULT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_VAULT_FILE)) {
    fs.writeFileSync(LOCAL_VAULT_FILE, JSON.stringify([]), 'utf-8');
  }
  if (!fs.existsSync(LOCAL_PAGES_VAULT_FILE)) {
    fs.writeFileSync(LOCAL_PAGES_VAULT_FILE, JSON.stringify([]), 'utf-8');
  }
}

function readLocalVault(): DocumentRecord[] {
  try {
    ensureLocalVaultDir();
    const content = fs.readFileSync(LOCAL_VAULT_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

function writeLocalVault(docs: DocumentRecord[]) {
  try {
    ensureLocalVaultDir();
    fs.writeFileSync(LOCAL_VAULT_FILE, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local documents vault:', err);
  }
}

function readLocalPagesVault(): DocumentPageRecord[] {
  try {
    ensureLocalVaultDir();
    const content = fs.readFileSync(LOCAL_PAGES_VAULT_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

function writeLocalPagesVault(pages: DocumentPageRecord[]) {
  try {
    ensureLocalVaultDir();
    fs.writeFileSync(LOCAL_PAGES_VAULT_FILE, JSON.stringify(pages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local document pages vault:', err);
  }
}

function syncToLocalPagesVault(newPages: DocumentPageRecord[]) {
  const existing = readLocalPagesVault();
  // Filter out any pages matching (document_id, page_number) to prevent duplicates
  const toUpsertKeys = new Set(newPages.map((p) => `${p.document_id}:${p.page_number}`));
  const retained = existing.filter((p) => !toUpsertKeys.has(`${p.document_id}:${p.page_number}`));
  retained.push(...newPages);
  writeLocalPagesVault(retained);
}

/**
 * Uploads a document to Supabase Storage and records metadata in PostgreSQL.
 */
export async function uploadDocumentRecord(
  fileBuffer: Buffer,
  originalFilename: string,
  declaredMimeType: string,
  fileSizeBytes: number,
  rawMetadata: DocumentMetadataInput,
  userId: string | null = null
): Promise<{ success: boolean; document?: DocumentRecord; error?: string }> {
  // 1. Server-side validation of file
  const fileVal = validateUploadFile({
    name: originalFilename,
    size: fileSizeBytes,
    type: declaredMimeType,
  });

  if (!fileVal.valid) {
    return { success: false, error: fileVal.error || 'Invalid file uploaded.' };
  }

  // 2. Server-side validation of metadata
  const metaVal = validateDocumentMetadata(rawMetadata);
  if (!metaVal.valid) {
    const errorDetails = Object.values(metaVal.errors).join(' ');
    return { success: false, error: errorDetails || 'Invalid document metadata.' };
  }

  const client = getSupabaseServiceClient();
  const bucketName = 'historical_archives';
  const storagePath = generateStoragePath(userId, originalFilename);

  // 3. Upload binary buffer to private Supabase Storage bucket
  const { error: storageError } = await client.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: fileVal.mimeType,
      upsert: false,
    });

  if (storageError) {
    return {
      success: false,
      error: `Storage upload failed: ${storageError.message}`,
    };
  }

  // 4. Prepare Document Record
  const newDocId = crypto.randomUUID();
  const now = new Date().toISOString();

  const docRecord: DocumentRecord = {
    id: newDocId,
    title: metaVal.sanitized.title,
    description: metaVal.sanitized.description,
    document_type: metaVal.sanitized.document_type,
    historical_period: metaVal.sanitized.historical_period,
    language: metaVal.sanitized.language || 'en',
    location_name: metaVal.sanitized.location_name,
    latitude: metaVal.sanitized.latitude,
    longitude: metaVal.sanitized.longitude,
    source_name: metaVal.sanitized.source_name,
    attribution: metaVal.sanitized.attribution,
    storage_path: storagePath,
    original_filename: originalFilename,
    mime_type: fileVal.mimeType!,
    file_size_bytes: fileSizeBytes,
    processing_status: 'uploaded',
    verification_status: 'unverified',
    created_by: userId,
    created_at: now,
    updated_at: now,
  };

  // 5. Insert into Supabase PostgreSQL documents table
  try {
    const { data: inserted, error: dbError } = await client
      .from('documents')
      .insert({
        id: docRecord.id,
        title: docRecord.title,
        description: docRecord.description,
        document_type: docRecord.document_type,
        historical_period: docRecord.historical_period,
        language: docRecord.language,
        location_name: docRecord.location_name,
        latitude: docRecord.latitude,
        longitude: docRecord.longitude,
        source_name: docRecord.source_name,
        attribution: docRecord.attribution,
        storage_path: docRecord.storage_path,
        original_filename: docRecord.original_filename,
        mime_type: docRecord.mime_type,
        file_size_bytes: docRecord.file_size_bytes,
        processing_status: docRecord.processing_status,
        verification_status: docRecord.verification_status,
        created_by: docRecord.created_by,
        created_at: docRecord.created_at,
        updated_at: docRecord.updated_at,
      })
      .select()
      .maybeSingle();

    if (dbError) {
      // If table is pending migration in Supabase, fallback to local vault store
      if (dbError.code === 'PGRST205') {
        const localVault = readLocalVault();
        localVault.unshift(docRecord);
        writeLocalVault(localVault);
        return { success: true, document: docRecord };
      }

      // Cleanup storage object on fatal insertion failure
      await client.storage.from(bucketName).remove([storagePath]);
      return {
        success: false,
        error: `Database insertion failed: ${dbError.message}. Uploaded file was safely cleaned up.`,
      };
    }

    return { success: true, document: inserted || docRecord };
  } catch (err: any) {
    // Attempt storage cleanup
    await client.storage.from(bucketName).remove([storagePath]);
    return {
      success: false,
      error: `Unexpected error during record persistence: ${err.message}`,
    };
  }
}

/**
 * Retrieves all registered documents from PostgreSQL (or local fallback).
 */
export async function listAllDocuments(): Promise<{
  documents: DocumentRecord[];
  source: 'supabase_postgres' | 'local_vault' | 'supabase_and_local';
  error?: string | null;
}> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const remoteDocuments = data as DocumentRecord[];
      const localDocuments = readLocalVault();
      const byId = new Map(remoteDocuments.map((document) => [document.id, document]));
      localDocuments.forEach((document) => {
        if (!byId.has(document.id)) byId.set(document.id, document);
      });
      const documents = Array.from(byId.values()).sort((left, right) =>
        right.created_at.localeCompare(left.created_at)
      );

      return {
        documents,
        source: localDocuments.length
          ? remoteDocuments.length ? 'supabase_and_local' : 'local_vault'
          : 'supabase_postgres',
      };
    }

    // Fallback to local vault if table is pending in Supabase
    const local = readLocalVault();
    return {
      documents: local,
      source: 'local_vault',
      error: error ? error.message : null,
    };
  } catch (err: any) {
    const local = readLocalVault();
    return {
      documents: local,
      source: 'local_vault',
      error: err?.message || 'Supabase document query failed.',
    };
  }
}

/**
 * Creates an authorized short-lived signed URL (default 5 minutes) for private file preview.
 */
export async function createDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 300
): Promise<{ signedUrl?: string; error?: string }> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client.storage
      .from('historical_archives')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (isMissingStorageObject(error)) {
      return { error: 'The original source file is unavailable in archive storage.' };
    }
    if (error) {
      return { error: `Failed to create signed URL: ${error.message}` };
    }

    return { signedUrl: data.signedUrl };
  } catch (err: any) {
    return { error: err.message || 'Error generating secure preview link.' };
  }
}

/**
 * Checks whether the original binary exists before exposing OCR or preview actions.
 * A signed URL is created only for the check and is immediately discarded.
 */
export async function getDocumentSourceAvailability(
  storagePath: string
): Promise<SourceAssetAvailability> {
  try {
    const client = getSupabaseServiceClient();
    const { error } = await client.storage
      .from('historical_archives')
      .createSignedUrl(storagePath, 60);

    if (!error) return { available: true };
    if (isMissingStorageObject(error)) return { available: false, reason: 'missing' };
    return { available: false, reason: 'storage_unavailable' };
  } catch {
    return { available: false, reason: 'storage_unavailable' };
  }
}

/**
 * Retrieves a single document record by UUID.
 */
export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return data as DocumentRecord;
    }
  } catch {
    // fallback to local vault
  }

  const local = readLocalVault();
  return local.find((d) => d.id === id) || null;
}

/**
 * Retrieves a single document record by its storage path (used to authorise signed URLs).
 */
export async function getDocumentByStoragePath(storagePath: string): Promise<DocumentRecord | null> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('storage_path', storagePath)
      .maybeSingle();
    if (!error && data) return data as DocumentRecord;
  } catch {
    // fall through to local vault
  }
  return readLocalVault().find((d) => d.storage_path === storagePath) || null;
}

/**
 * Updates the processing status of a document (e.g. uploaded -> processing -> completed).
 */
export async function updateDocumentStatus(
  id: string,
  status: ProcessingStatus
): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const client = getSupabaseServiceClient();
    await client
      .from('documents')
      .update({ processing_status: status, updated_at: now })
      .eq('id', id);
  } catch {
    // ignore
  }

  // Update in local vault as well
  const local = readLocalVault();
  const idx = local.findIndex((d) => d.id === id);
  if (idx !== -1) {
    local[idx].processing_status = status;
    local[idx].updated_at = now;
    writeLocalVault(local);
  }
  return true;
}

/**
 * Downloads a private document buffer from Supabase Storage.
 */
export async function downloadDocumentBuffer(
  storagePath: string
): Promise<{ buffer?: Buffer; error?: string }> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client.storage
      .from('historical_archives')
      .download(storagePath);

    if (isMissingStorageObject(error)) {
      return { error: 'The original source file is unavailable in archive storage.' };
    }
    if (error || !data) {
      return { error: `Storage download failed: ${error?.message || 'Object not found'}` };
    }

    const arrayBuffer = await data.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer) };
  } catch (err: any) {
    return { error: `Storage exception: ${err.message}` };
  }
}

/**
 * Saves extracted document pages into PostgreSQL and local fallback cache.
 * Uses upsert on (document_id, page_number) to prevent duplicate records during retries.
 */
export async function saveDocumentPages(
  pagesInput: DocumentPageInsertInput[]
): Promise<{ success: boolean; pages: DocumentPageRecord[]; error?: string }> {
  if (!pagesInput || pagesInput.length === 0) {
    return { success: true, pages: [] };
  }

  const now = new Date().toISOString();
  const records: DocumentPageRecord[] = pagesInput.map((p) => ({
    id: crypto.randomUUID(),
    document_id: p.document_id,
    page_number: p.page_number,
    extracted_text: p.extracted_text,
    extraction_method: p.extraction_method,
    extraction_status: p.extraction_status,
    confidence_score: p.confidence_score ?? null,
    word_count: p.word_count ?? 0,
    detected_language: p.detected_language ?? 'en',
    created_at: now,
    updated_at: now,
  }));

  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('document_pages')
      .upsert(
        records.map((r) => ({
          document_id: r.document_id,
          page_number: r.page_number,
          extracted_text: r.extracted_text,
          extraction_method: r.extraction_method,
          extraction_status: r.extraction_status,
          confidence_score: r.confidence_score,
          word_count: r.word_count,
          detected_language: r.detected_language,
          updated_at: r.updated_at,
        })),
        { onConflict: 'document_id,page_number' }
      )
      .select();

    if (!error && Array.isArray(data) && data.length > 0) {
      syncToLocalPagesVault(records);
      return { success: true, pages: data as DocumentPageRecord[] };
    }
  } catch {
    // fallback
  }

  // Graceful local sync
  syncToLocalPagesVault(records);
  return { success: true, pages: records };
}

/**
 * Retrieves all extracted pages for a document ordered by page_number.
 */
export async function getDocumentPages(
  documentId: string
): Promise<DocumentPageRecord[]> {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('document_pages')
      .select('*')
      .eq('document_id', documentId)
      .order('page_number', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as DocumentPageRecord[];
    }
  } catch {
    // fallback
  }

  const local = readLocalPagesVault();
  return local
    .filter((p) => p.document_id === documentId)
    .sort((a, b) => a.page_number - b.page_number);
}
