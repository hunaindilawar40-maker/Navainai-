module.exports = function handler(req, res) {
  res.json({ key: process.env.NAVAIN_KEY });
}
