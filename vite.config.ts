import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function virasatBackendPlugin(): Plugin {
  return {
    name: 'virasat-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const send = (status: number, payload: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        try {
          // Read the body with a hard size cap
          const { handleApi, MAX_BODY_BYTES } = (await server.ssrLoadModule('/src/server/api.ts')) as typeof import('./src/server/api.ts');
          let body: unknown = {};
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of req) {
              size += (chunk as Buffer).length;
              if (size > MAX_BODY_BYTES) return send(413, { error: 'Request body is too large.' });
              chunks.push(chunk as Buffer);
            }
            const text = Buffer.concat(chunks).toString('utf-8');
            try {
              body = text ? JSON.parse(text) : {};
            } catch {
              return send(400, { error: 'Request body must be valid JSON.' });
            }
          }
          const out = await handleApi({
            method: req.method || 'GET',
            url: req.url,
            headers: req.headers,
            body,
          });
          send(out.status, out.json);
        } catch (err: any) {
          console.error('API middleware error:', err);
          send(500, { error: err?.message || 'Internal server error' });
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
        '@': path.resolve(projectRoot, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
