import { cors, readJson, rateLimit } from '../lib/api-utils.js';

/**
 * Server-side proxy for the "Stacy" chat widget.
 *
 * The browser posts here, this function talks to Groq with the secret key.
 * The key is never sent to the client.
 */

// GROQ_API_URL exists so the endpoint can be pointed at a mock during testing.
const GROQ_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_HISTORY = 20; // keep the last N turns so requests stay small
const MAX_MESSAGE_CHARS = 4000;

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // A plain, non-technical message — this is what visitors would see.
    return res.status(503).json({
      error:
        'The AI assistant is offline right now. Please email revenuepartners.co@gmail.com or call +1 (209) 960-3164.',
    });
  }

  if (!rateLimit(req, res, { limit: 20, windowMs: 5 * 60 * 1000 })) return;

  try {
    const body = await readJson(req);

    const messages = [];
    if (body.system) {
      messages.push({ role: 'system', content: String(body.system).slice(0, 8000) });
    }

    if (Array.isArray(body.messages)) {
      const turns = body.messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .slice(-MAX_HISTORY)
        .map((m) => ({
          role: m.role,
          content: String(m.content).slice(0, MAX_MESSAGE_CHARS),
        }));
      messages.push(...turns);
    }

    if (!messages.some((m) => m.role !== 'system')) {
      messages.push({ role: 'user', content: 'Hello' });
    }

    const maxTokens = Number.isFinite(Number(body.max_tokens))
      ? Math.min(Math.max(Number(body.max_tokens), 64), 2000)
      : 1000;

    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: 0.6,
        messages,
      }),
    });

    const data = await groqResponse.json().catch(() => ({}));

    if (!groqResponse.ok || data.error) {
      const detail = data?.error?.message || `Groq request failed (${groqResponse.status})`;
      console.error('[api/chat] Groq error:', detail);
      return res.status(502).json({ error: 'The AI assistant had a connection issue. Please try again.' });
    }

    const text =
      data?.choices?.[0]?.message?.content ||
      "I'm having a quick moment — please try again!";

    // Anthropic-style envelope so the markup on the pages can stay simple.
    return res.status(200).json({
      text,
      content: [{ type: 'text', text }],
    });
  } catch (err) {
    console.error('[api/chat] unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error. Please try again.' });
  }
}
