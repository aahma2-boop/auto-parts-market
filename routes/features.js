const express = require('express');
const db = require('../db');
const auth = require('./auth');

const router = express.Router();

// Messaging endpoints
router.post('/messages/:recipient_id', auth.requireAuth, (req, res) => {
  const { recipient_id } = req.params;
  const { body, listing_id } = req.body;
  const sender_id = req.user.id;

  if (!body || !recipient_id) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const result = db.prepare(`
    INSERT INTO messages (sender_id, recipient_id, listing_id, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sender_id, recipient_id, listing_id || null, body, Date.now());

  res.json({ ok: true, id: result.lastInsertRowid });
});

router.get('/messages', auth.requireAuth, (req, res) => {
  const userId = req.user.id;
  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE recipient_id = ? OR sender_id = ?
    ORDER BY created_at DESC
  `).all(userId, userId);
  res.json(messages);
});

router.post('/messages/:id/read', auth.requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE messages SET read = 1 WHERE id = ? AND recipient_id = ?')
    .run(id, req.user.id);
  res.json({ ok: true });
});

// Saved items endpoints
router.post('/saved/:listing_id', auth.requireAuth, (req, res) => {
  const { listing_id } = req.params;
  const user_id = req.user.id;

  try {
    db.prepare(`
      INSERT INTO saved_items (user_id, listing_id, created_at)
      VALUES (?, ?, ?)
    `).run(user_id, listing_id, Date.now());
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Already saved' });
  }
});

router.delete('/saved/:listing_id', auth.requireAuth, (req, res) => {
  const { listing_id } = req.params;
  db.prepare('DELETE FROM saved_items WHERE user_id = ? AND listing_id = ?')
    .run(req.user.id, listing_id);
  res.json({ ok: true });
});

router.get('/saved', auth.requireAuth, (req, res) => {
  const saved = db.prepare(`
    SELECT l.* FROM listings l
    INNER JOIN saved_items s ON l.id = s.listing_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).all(req.user.id);
  res.json(saved);
});

// Ratings endpoints
router.post('/ratings', auth.requireAuth, (req, res) => {
  const { seller_id, order_id, rating, comment } = req.body;
  const buyer_id = req.user.id;

  if (!seller_id || !order_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating' });
  }

  const result = db.prepare(`
    INSERT INTO ratings (buyer_id, seller_id, order_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(buyer_id, seller_id, order_id, rating, comment || null, Date.now());

  res.json({ ok: true, id: result.lastInsertRowid });
});

router.get('/ratings/seller/:seller_id', (req, res) => {
  const { seller_id } = req.params;
  const ratings = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count
    FROM ratings WHERE seller_id = ?
  `).get(seller_id);
  res.json(ratings);
});

module.exports = router;