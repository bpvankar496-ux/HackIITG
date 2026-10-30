/**
 * Framework-neutral API handler. Used by the Vite dev middleware and by server.ts (Express),
 * so `npm run dev` and a production deploy run exactly the same routes.
 */

import { getServiceSupabaseClient, getServerSupabaseUrl } from '../lib/supabaseAdmin.ts';
import { isRateLimited } from './rateLimit.ts';

export const MAX_BODY_BYTES = 30 * 1024 * 1024; // 20 MB file as base64 plus metadata
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const HOUR = 60 * 60 * 1000;

export interface ApiRequest {
  method: string;
  url: string; // path plus query, e.g. /api/documents?x=1
  headers: Record<string, string | string[] | undefined>;
  body: any;
}

export interface ApiResponse {
  status: number;
  json: unknown;
}

interface AuthedUser {
  id: string;
  email?: string;
}

const json = (status: number, payload: unknown): ApiResponse => ({ status, json: payload });

/** Verifies the Supabase access token sent as `Authorization: Bearer <token>`. */
async function getUser(headers: ApiRequest['headers']): Promise<AuthedUser | null> {
  const raw = headers['authorization'] || headers['Authorization'];
  const header = Array.isArray(raw) ? raw[0] : raw;
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  try {
    const { data, error } = await getServiceSupabaseClient().auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

/** Dev-only escape hatch for running without Supabase Auth. Ignored in production. */
const anonymousAllowed = () =>
  process.env.ALLOW_ANONYMOUS_API === 'true' && process.env.NODE_ENV !== 'production';

async function requireUser(
  req: ApiRequest
): Promise<{ user: AuthedUser } | { error: ApiResponse }> {
  const user = await getUser(req.headers);
  if (user) return { user };
  if (anonymousAllowed()) return { user: { id: 'dev-anonymous' } };
  return { error: json(401, { ok: false, error: 'Sign in to use this feature.' }) };
}

export async function handleApi(req: ApiRequest): Promise<ApiResponse> {
  const urlObj = new URL(req.url, 'http://localhost');
  const route = urlObj.pathname;
  const method = req.method.toUpperCase();
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    // 1. Diagnostics: no secrets, no bucket or table details beyond readiness flags
    if (route === '/api/database/status' && method === 'GET') {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) {
        return json(200, {
          connected: false,
          configured: false,
          error: 'Supabase URL or Service Role Key missing.',
        });
      }
      const client = getServiceSupabaseClient();
      const started = Date.now();
      const { data: buckets, error: bError } = await client.storage.listBuckets();
      const { count, error: docError } = await client
        .from('documents')
        .select('id', { count: 'exact', head: true });
      return json(200, {
        connected: true,
        configured: true,
        latencyMs: Date.now() - started,
        url: getServerSupabaseUrl(),
        hasAnonKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
        storage: {
          ready: buckets?.some((b) => b.name === 'historical_archives') ?? false,
          bucketName: 'historical_archives',
          isPrivate: true,
          allBuckets: [],
          error: bError?.message || null,
        },
        database: {
          documentsTableReady: !docError,
          documentCount: count ?? 0,
          error: docError
            ? docError.code === 'PGRST205'
              ? 'Table "documents" pending SQL execution in Supabase.'
              : docError.message
            : null,
        },
      });
    }

    // 2. Public read endpoints
    if (route === '/api/documents' && method === 'GET') {
      const { listAllDocuments } = await import('./documentRepository.ts');
      return json(200, { ok: true, ...(await listAllDocuments()) });
    }

    if (route === '/api/documents/pages' && method === 'GET') {
      const documentId = urlObj.searchParams.get('documentId');
      if (!documentId) return json(400, { error: 'documentId query parameter is required.' });
      const { getDocumentExtractionStatus } = await import('./textExtractionEngine.ts');
      return json(200, { ok: true, ...(await getDocumentExtractionStatus(documentId)) });
    }

    if (route === '/api/archive/search' && method === 'GET') {
      const p = urlObj.searchParams;
      const clamp = (v: string | null, def: number, max: number) =>
        Math.min(Math.max(parseInt(v || String(def), 10) || def, 0), max);
      const { searchArchivalPassages } = await import('./searchRepository.ts');
      const result = await searchArchivalPassages(
        {
          query: (p.get('q') || '').slice(0, 300),
          documentType: (p.get('type') || 'all') as any,
          historicalPeriod: p.get('period') || 'all',
          location: p.get('location') || 'all',
          language: p.get('language') || 'all',
          verificationStatus: (p.get('verification') || 'all') as any,
        },
        clamp(p.get('limit'), 30, 100),
        clamp(p.get('offset'), 0, 10_000)
      );
      return json(200, { ok: true, ...result });
    }

    // 3. Everything below needs a signed-in user
    if (method === 'POST') {
      const auth = await requireUser(req);
      if ('error' in auth) return auth.error;
      const user = auth.user;

      if (route === '/api/documents/upload') {
        if (isRateLimited(`upload:${user.id}`, 20, HOUR)) {
          return json(429, { error: 'Upload limit reached. Try again later.' });
        }
        const { fileBase64, filename, mimeType, metadata } = body;
        if (typeof fileBase64 !== 'string' || typeof filename !== 'string' || !fileBase64 || !filename) {
          return json(400, { error: 'fileBase64 and filename are required.' });
        }
        const buffer = Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
        if (buffer.length > MAX_FILE_BYTES) {
          return json(413, { error: 'File is larger than the 20 MB limit.' });
        }
        const { uploadDocumentRecord } = await import('./documentRepository.ts');
        // Size and owner come from the server, never from the request body
        const result = await uploadDocumentRecord(
          buffer,
          filename,
          typeof mimeType === 'string' ? mimeType : 'application/pdf',
          buffer.length,
          metadata || {},
          user.id === 'dev-anonymous' ? null : user.id
        );
        if (!result.success) return json(400, { error: result.error });
        return json(201, { ok: true, document: result.document });
      }

      if (route === '/api/documents/process') {
        const { documentId } = body;
        if (typeof documentId !== 'string' || !documentId) {
          return json(400, { error: 'documentId is required in request body.' });
        }
        const { getDocumentById } = await import('./documentRepository.ts');
        const doc = await getDocumentById(documentId);
        if (!doc) return json(404, { ok: false, error: 'Document not found.' });
        if (doc.created_by !== user.id && user.id !== 'dev-anonymous') {
          return json(403, { ok: false, error: 'Only the uploader can process this document.' });
        }
        if (isRateLimited(`process:${user.id}`, 30, HOUR)) {
          return json(429, { ok: false, error: 'Processing limit reached. Try again later.' });
        }
        const { processDocumentExtraction } = await import('./textExtractionEngine.ts');
        const result = await processDocumentExtraction(documentId);
        if (!result.success) return json(400, { ok: false, error: result.error });
        return json(200, {
          ok: true,
          documentId: result.documentId,
          method: result.method,
          pages: result.pages,
        });
      }

      if (route === '/api/documents/signed-url') {
        const { storagePath } = body;
        if (typeof storagePath !== 'string' || !storagePath || storagePath.includes('..')) {
          return json(400, { error: 'storagePath is required.' });
        }
        const { getDocumentByStoragePath, createDocumentSignedUrl } = await import('./documentRepository.ts');
        const doc = await getDocumentByStoragePath(storagePath);
        const allowed =
          doc && (doc.created_by === user.id || doc.verification_status !== 'unverified' || user.id === 'dev-anonymous');
        if (!allowed) return json(403, { error: 'You do not have access to this file.' });
        const expiresInSeconds = Math.min(Math.max(Number(body.expiresInSeconds) || 300, 60), 600);
        const result = await createDocumentSignedUrl(storagePath, expiresInSeconds);
        if (result.error) return json(400, { error: result.error });
        return json(200, { ok: true, signedUrl: result.signedUrl, expiresInSeconds });
      }

      if (route === '/api/archive/assistant') {
        const { question, conversationHistory, filters } = body;
        if (typeof question !== 'string' || !question.trim()) {
          return json(400, { ok: false, error: 'A research question is required.' });
        }
        if (isRateLimited(`assistant:${user.id}`, 30, HOUR)) {
          return json(429, { ok: false, error: 'Question limit reached. Try again later.' });
        }
        const { executeArchivalAssistantInquiry } = await import('./assistantService.ts');
        const result = await executeArchivalAssistantInquiry({
          question,
          conversationHistory: Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [],
          filters: filters || {},
        });
        return json(result.ok ? 200 : 400, result);
      }

      if (route === '/api/archive/ocr') {
        const { imageBase64, mimeType = 'image/jpeg' } = body;
        if (typeof imageBase64 !== 'string' || !imageBase64) {
          return json(400, { error: 'Missing imageBase64 data in request body.' });
        }
        if (isRateLimited(`ocr:${user.id}`, 20, HOUR)) {
          return json(429, { error: 'OCR limit reached. Try again later.' });
        }
        const { processArchivalDocumentOcr } = await import('./geminiService.ts');
        const result = await processArchivalDocumentOcr(imageBase64, String(mimeType));
        return json(200, { ok: true, result });
      }
    }

    return json(404, { error: `Endpoint ${route} not found` });
  } catch (err: any) {
    console.error('API error:', err);
    return json(500, { error: err?.message || 'Internal server error' });
  }
}
