import { cors, readJson, rateLimit, env } from '../lib/api-utils.js';

/**
 * Text-to-speech proxy (ElevenLabs).
 *
 * The browser posts { text } here and gets audio back — the ElevenLabs key
 * stays on the server.
 *
 * Accepts either ELEVEN_API_KEY or ELEVEN_KEY as the environment variable name,
 * so the old mismatch between api/config.js and api/speak.js can't break it.
 */

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // "Rachel"
const MAX_CHARS = 2500;

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = env('ELEVEN_API_KEY', 'ELEVEN_KEY');
  if (!apiKey) {
    return res.status(503).json({ error: 'Voice playback is not configured (ELEVEN_API_KEY missing).' });
  }

  if (!rateLimit(req, res, { limit: 15, windowMs: 5 * 60 * 1000 })) return;

  try {
    const body = await readJson(req);
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_CHARS) : '';

    if (!text) {
      return res.status(400).json({ error: 'Missing "text".' });
    }

    const voiceId = body.voiceId || env('ELEVEN_VOICE_ID') || DEFAULT_VOICE_ID;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVEN_MODEL || 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[api/speak] ElevenLabs error:', response.status, detail);
      return res.status(502).json({ error: 'Voice playback failed. Please try again.' });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(audioBuffer);
  } catch (err) {
    console.error('[api/speak] unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}
