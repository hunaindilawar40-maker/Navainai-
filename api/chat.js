module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

  try {
    // Robustly parse the request body
    let body;
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      body = JSON.parse(raw);
    } catch (e) {
      body = req.body || {};
    }

    // Build messages array in Groq/OpenAI format
    const messages = [];
    if (body.system) {
      messages.push({ role: 'system', content: body.system });
    }
    if (Array.isArray(body.messages)) {
      body.messages.forEach(function(m) {
        if (m.role && m.content) {
          messages.push({ role: m.role, content: m.content });
        }
      });
    }

    // Fallback so we never send an empty messages array
    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'Hello' });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages: messages
      })
    });

    const data = await groqResponse.json();

    // Surface Groq errors clearly
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = (data.choices && data.choices[0] && data.choices[0].message)
      ? data.choices[0].message.content
      : 'Sorry, I could not respond right now. Please try again!';

    // Return in Anthropic-style so the HTML JS works without changes
    return res.status(200).json({
      content: [{ type: 'text', text: text }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
