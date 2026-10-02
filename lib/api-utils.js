/**
 * Shared helpers for the serverless functions in /api.
 *
 * NOTE: this file is intentionally secret-free. It lives outside /api because
 * Vercel only turns files inside /api into functions, and it must never read or
 * return an API key.
 */

/** Permissive CORS for the marketing site (the site is served from the same origin). */
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Read a JSON request body.
 * Vercel fills `req.body` for JSON payloads; a plain Node server does not, so we
 * fall back to consuming the stream.
 */
export async function readJson(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(req.body);
    } catch {
      /* fall through to stream read */
    }
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Small in-memory limiter so one visitor can't burn through the API quota.
 * Serverless instances each keep their own counter — it is a brake, not a wall.
 */
const hits = new Map();

export function rateLimit(req, res, { limit = 20, windowMs = 5 * 60 * 1000 } = {}) {
  const now = Date.now();
  const key = clientIp(req);
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
  } else if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Too many requests — please wait a moment and try again.',
    });
    return false;
  } else {
    entry.count += 1;
  }

  // Opportunistic cleanup so the map cannot grow forever.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  return true;
}

/** First value found in the environment — lets old and new variable names both work. */
export function env(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim()) return String(value).trim();
  }
  return '';
}
