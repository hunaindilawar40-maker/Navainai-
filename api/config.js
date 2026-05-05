export default function handler(req, res) {
  res.json({
    key: process.env.GROQ_API_KEY || '',
    elevenKey: process.env.ELEVEN_API_KEY || ''
  });
}
