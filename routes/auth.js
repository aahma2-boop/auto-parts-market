const db = require('../db');

function requireAuth(req, res, next) {
  const token = req.cookies.session;
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return res.status(401).json({ error: 'Invalid session' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  req.user = user;
  next();
}

module.exports = { requireAuth };