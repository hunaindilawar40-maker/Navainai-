/**
 * Local dev server for Navain AI.
 *
 * Serves the static .html pages exactly like Vercel does, and runs the files in
 * /api as if they were serverless functions, so you can preview the whole site
 * (AI chat included) with `npm run dev`.
 *
 * Not for production — Vercel runs /api itself in the cloud.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

// ---------------------------------------------------------------- env loading
function loadEnvFile(file) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
    console.log(`[env] loaded ${file}`);
  } catch {
    /* file is optional */
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

// ------------------------------------------------------------------- helpers
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function decorateResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
    return res;
  };
  res.send = (payload) => {
    if (Buffer.isBuffer(payload)) return res.end(payload), res;
    if (payload && typeof payload === 'object') return res.json(payload);
    return res.end(String(payload ?? '')), res;
  };
  return res;
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;
  if ((req.headers['content-type'] || '').includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

// --------------------------------------------------------------- API runtime
async function handleApi(req, res, urlPath) {
  const name = urlPath.replace(/^\/api\/?/, '').replace(/\/+$/, '');

  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    return res.status(404).json({ error: 'Unknown endpoint' });
  }

  const file = path.join(ROOT, 'api', `${name}.js`);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: `No such API endpoint: /api/${name}` });
  }

  req.body = await readBody(req);

  // Cache-bust so edits to api/*.js apply on refresh without restarting.
  const module = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  const handler = module.default || module.handler;

  if (typeof handler !== 'function') {
    return res.status(500).json({ error: 'Endpoint has no default export function' });
  }

  await handler(req, res);
  if (!res.writableEnded) res.end();
}

// ----------------------------------------------------------- static file host
async function resolveStatic(urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (rel.endsWith('/')) rel += 'index.html';

  let file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT)) return null; // path traversal guard

  const tryFiles = [file];
  if (!path.extname(file)) tryFiles.push(`${file}.html`, path.join(file, 'index.html'));

  for (const candidate of tryFiles) {
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) return candidate;
      if (stat.isDirectory()) {
        const index = path.join(candidate, 'index.html');
        if (fs.existsSync(index)) return index;
      }
    } catch {
      /* keep looking */
    }
  }
  return null;
}

async function serveStatic(req, res, urlPath) {
  const file = await resolveStatic(urlPath);

  if (!file) {
    return res.status(404).json({ error: `Not found: ${urlPath}` });
  }

  const ext = path.extname(file).toLowerCase();
  let body = await fs.promises.readFile(file);

  // Dev-only convenience: the pages link to the live domain, which would take
  // you off the local preview. Serve them as same-origin links instead.
  if (ext === '.html') {
    body = Buffer.from(
      body.toString('utf8').replaceAll('https://navainai.vercel.app', ''),
      'utf8'
    );
  }

  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', ext === '.html' ? 'no-store' : 'public, max-age=60');
  if (req.method === 'HEAD') return res.end();
  res.end(body);
}

// -------------------------------------------------------------------- server
const server = http.createServer(async (req, res) => {
  decorateResponse(res);

  const urlPath = (req.url || '/').split('?')[0];
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} → ${res.statusCode} (${Date.now() - started}ms)`);
  });

  try {
    if (urlPath === '/api' || urlPath.startsWith('/api/')) {
      await handleApi(req, res, urlPath);
    } else {
      await serveStatic(req, res, urlPath);
    }
  } catch (err) {
    console.error('[dev-server]', err);
    if (!res.writableEnded) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  }
});

server.listen(PORT, HOST, () => {
  const configured = [
    process.env.GROQ_API_KEY ? 'chat ✅' : 'chat ❌ (no GROQ_API_KEY)',
    process.env.ELEVEN_API_KEY || process.env.ELEVEN_KEY ? 'voice ✅' : 'voice ❌ (no ELEVEN_API_KEY)',
  ].join('  |  ');
  console.log(`\nNavain AI preview → http://localhost:${PORT}`);
  console.log(`  ${configured}`);
  console.log('  Add keys to .env.local (see .env.example), then refresh.\n');
});
