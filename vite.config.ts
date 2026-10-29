import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function virasatBackendPlugin(): Plugin {
  return {
    name: 'virasat-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const parseJsonBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const sendJson = (statusCode: number, payload: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        try {
          // 1. Database & Storage Diagnostic Health Check
          if (req.url === '/api/database/status' && req.method === 'GET') {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xacjsdzltfprtueovcrd.supabase.co';
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !serviceKey) {
              return sendJson(200, {
                connected: false,
                configured: false,
                error: 'Supabase URL or Service Role Key missing.',
              });
            }

            const startTime = Date.now();
            const client = createClient(supabaseUrl, serviceKey);

            // Check storage buckets
            const { data: buckets, error: bError } = await client.storage.listBuckets();
            const hasArchiveBucket = buckets?.some((b) => b.name === 'historical_archives') ?? false;

            // Check documents table
            const { count: docCount, error: docError } = await client
              .from('documents')
              .select('id', { count: 'exact', head: true });

            const latency = Date.now() - startTime;

            return sendJson(200, {
              connected: true,
              configured: true,
              latencyMs: latency,
              url: supabaseUrl,
              hasAnonKey: Boolean(anonKey),
              storage: {
                ready: hasArchiveBucket,
                bucketName: 'historical_archives',
                isPrivate: true,
                allBuckets: buckets?.map((b) => b.name) || [],
                error: bError?.message || null,
              },
              database: {
                documentsTableReady: !docError,
                documentCount: docCount ?? 0,
                error: docError
                  ? docError.code === 'PGRST205'
                    ? 'Table "documents" pending SQL execution in Supabase.'
                    : docError.message
                  : null,
              },
            });
          }

          // 2. List all documents
          if (req.url === '/api/documents' && req.method === 'GET') {
            const { listAllDocuments } = await import('./src/server/documentRepository.ts');
            const result = await listAllDocuments();
            return sendJson(200, { ok: true, ...result });
          }

          // 3. Document Upload
          if (req.url === '/api/documents/upload' && req.method === 'POST') {
            const body = await parseJsonBody();
            const { fileBase64, filename, mimeType, fileSizeBytes, metadata, userId } = body;

            if (!fileBase64 || !filename) {
              return sendJson(400, { error: 'fileBase64 and filename are required.' });
            }

            const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');

            const { uploadDocumentRecord } = await import('./src/server/documentRepository.ts');
            const result = await uploadDocumentRecord(
              buffer,
              filename,
              mimeType || 'application/pdf',
              fileSizeBytes || buffer.length,
              metadata || {},
              userId || null
            );

            if (!result.success) {
              return sendJson(400, { error: result.error });
            }

            return sendJson(201, { ok: true, document: result.document });
          }

          // 4. Generate Short-Lived Signed URL for Private Document Preview
          if (req.url === '/api/documents/signed-url' && req.method === 'POST') {
            const body = await parseJsonBody();
            const { storagePath, expiresInSeconds = 300 } = body;

            if (!storagePath) {
              return sendJson(400, { error: 'storagePath is required.' });
            }

            const { createDocumentSignedUrl } = await import('./src/server/documentRepository.ts');
            const result = await createDocumentSignedUrl(storagePath, expiresInSeconds);

            if (result.error) {
              return sendJson(400, { error: result.error });
            }

            return sendJson(200, { ok: true, signedUrl: result.signedUrl, expiresInSeconds });
          }

          // 5. Trigger Text Extraction and OCR Pipeline
          if (req.url === '/api/documents/process' && req.method === 'POST') {
            const body = await parseJsonBody();
            const { documentId } = body;

            if (!documentId) {
              return sendJson(400, { error: 'documentId is required in request body.' });
            }

            const { processDocumentExtraction } = await import('./src/server/textExtractionEngine.ts');
            const result = await processDocumentExtraction(documentId);

            if (!result.success) {
              return sendJson(400, { ok: false, error: result.error });
            }

            return sendJson(200, {
              ok: true,
              documentId: result.documentId,
              method: result.method,
              pages: result.pages,
            });
          }

          // 6. Get Extracted Document Pages and Status
          if (req.url?.startsWith('/api/documents/pages') && req.method === 'GET') {
            const urlObj = new URL(req.url, 'http://localhost');
            const documentId = urlObj.searchParams.get('documentId');

            if (!documentId) {
              return sendJson(400, { error: 'documentId query parameter is required.' });
            }

            const { getDocumentExtractionStatus } = await import('./src/server/textExtractionEngine.ts');
            const result = await getDocumentExtractionStatus(documentId);
            return sendJson(200, { ok: true, ...result });
          }

          // 7. Full-Text Archive Search across Extracted Passages & Metadata
          if (req.url?.startsWith('/api/archive/search') && req.method === 'GET') {
            const urlObj = new URL(req.url, 'http://localhost');
            const q = urlObj.searchParams.get('q') || '';
            const documentType = (urlObj.searchParams.get('type') || 'all') as any;
            const historicalPeriod = urlObj.searchParams.get('period') || 'all';
            const location = urlObj.searchParams.get('location') || 'all';
            const language = urlObj.searchParams.get('language') || 'all';
            const verificationStatus = (urlObj.searchParams.get('verification') || 'all') as any;
            const limit = parseInt(urlObj.searchParams.get('limit') || '30', 10);
            const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);

            const { searchArchivalPassages } = await import('./src/server/searchRepository.ts');
            const result = await searchArchivalPassages(
              {
                query: q,
                documentType,
                historicalPeriod,
                location,
                language,
                verificationStatus,
              },
              limit,
              offset
            );

            return sendJson(200, { ok: true, ...result });
          }

          // 8. Grounded AI Heritage Research Assistant
          if (req.url === '/api/archive/assistant' && req.method === 'POST') {
            const body = await parseJsonBody();
            const { question, conversationHistory, filters } = body;

            if (!question) {
              return sendJson(400, { ok: false, error: 'A research question is required.' });
            }

            const { executeArchivalAssistantInquiry } = await import('./src/server/assistantService.ts');
            const result = await executeArchivalAssistantInquiry({
              question,
              conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
              filters: filters || {},
            });

            return sendJson(result.ok ? 200 : 400, result);
          }

          // 9. OCR Ingestion
          if (req.url === '/api/archive/ocr' && req.method === 'POST') {
            const body = await parseJsonBody();
            const { imageBase64, mimeType = 'image/jpeg' } = body;
            if (!imageBase64) {
              return sendJson(400, { error: 'Missing imageBase64 data in request body.' });
            }

            const { processArchivalDocumentOcr } = await import('./src/server/geminiService.ts');
            const result = await processArchivalDocumentOcr(imageBase64, mimeType);
            return sendJson(200, { ok: true, result });
          }

          return sendJson(404, { error: `Endpoint ${req.url} not found` });
        } catch (err: any) {
          console.error('API Middleware Error:', err);
          return sendJson(500, { error: err?.message || 'Internal server error' });
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), virasatBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
