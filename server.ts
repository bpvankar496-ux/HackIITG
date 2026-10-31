/**
 * Production server: serves the built app (dist/) and the same /api routes the Vite dev server uses.
 * Run: npm run build && npm start
 * Needs a host that runs Node (Render, Railway, Fly.io, a VPS). Static-only hosts cannot run /api.
 */
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApi, MAX_BODY_BYTES } from './src/server/api.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();
process.env.NODE_ENV ||= 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');

app.use('/api', express.json({ limit: MAX_BODY_BYTES }));

app.all('/api/*', async (req, res) => {
  try {
    const out = await handleApi({
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
    });
    res.status(out.status).json(out.json);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bad JSON or oversized body
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
  next(err);
});

const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Virasat  running on http://localhost:${port}`));
