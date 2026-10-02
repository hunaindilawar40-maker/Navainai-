/**
 * Public, secret-free feature flags.
 *
 * This used to return the raw Groq and ElevenLabs keys to the browser, which
 * let anyone copy them out of the network tab. It now returns booleans only —
 * the browser never sees a key.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const chat = Boolean(process.env.GROQ_API_KEY);
  const tts = Boolean(process.env.ELEVEN_API_KEY || process.env.ELEVEN_KEY);

  res.status(200).json({
    chat,
    tts,
    chatEndpoint: '/api/chat',
    ttsEndpoint: '/api/speak',
  });
}
