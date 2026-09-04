const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const duty = require('./duty');
const payments = require('./payments');

const app = express();

// Serve frontend
app.use(express.static('public'));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Uploads directory
const DATA_DIR = process.env.DATA_DIR || __dirname;
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// AUTH
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, country, city, region } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(password, 10);
  const now = Date.now();

  try {
    const result = db.prepare(`
      INSERT INTO users (name,email,pass_hash,country,city,region,created_at)
      VALUES (?,?,?,?,?,?,?)
    `).run(name, email, hash, country || 'USA', city || '', region || '', now);
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const bcrypt = require('bcryptjs');
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.pass_hash)) return res.status(400).json({ error: 'Invalid credentials' });

  const token = require('crypto').randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token,user_id,created_at) VALUES (?,?,?)')
    .run(token, user.id, Date.now());

  res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

// LISTINGS
app.get('/api/listings', (req, res) => {
  const rows = db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/listings', upload.single('image'), (req, res) => {
  const token = req.cookies.session;
  const session = db.prepare('SELECT * FROM sessions WHERE token=?').get(token);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const userId = session.user_id;
  const now = Date.now();
  const {
    title, category, condition, price, currency,
    fitment, description, country, city, region, made_in
  } = req.body;

  const image = req.file ? req.file.filename : '';

  const result = db.prepare(`
    INSERT INTO listings (user_id,title,category,condition,price,currency,fitment,description,
      country,city,region,made_in,image,sold,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    userId, title, category, condition, price, currency,
    fitment, description, country, city, region, made_in,
    image, 0, now
  );

  res.json({ ok: true, id: result.lastInsertRowid });
});

// DUTY ESTIMATOR
app.post('/api/duty', (req, res) => {
  res.json(duty.estimate(req.body));
});

// PAYMENTS
app.post('/api/payments/connect', async (req, res) => {
  const token = req.cookies.session;
  const session = db.prepare('SELECT * FROM sessions WHERE token=?').get(token);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);
  const link = await payments.connectUrl(user);
  res.json(link);
});

app.post('/api/payments/checkout', async (req, res) => {
  const token = req.cookies.session;
  const session = db.prepare('SELECT * FROM sessions WHERE token=?').get(token);
  if (!session) return res.status(401).json({ error: 'Not logged in' });

  const buyer = db.prepare('SELECT * FROM users WHERE id=?').get(session.user_id);
  const listing = db.prepare('SELECT * FROM listings WHERE id=?').get(req.body.listing_id);
  const result = await payments.checkout(listing, buyer);
  res.json(result);
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const out = payments.handleWebhook(req);
    res.json(out);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auto Parts Market running → http://localhost:${PORT}`);
});