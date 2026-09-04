const Database = require('better-sqlite3');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'data.db');

let db;

try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
} catch (e) {
  console.warn('SQLite unavailable, falling back to sql.js');
  // Fallback: use sql.js for testing
  let SQL;
  initSqlJs().then(sqlJs => {
    SQL = sqlJs;
    db = new SQL.Database();
  });
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  country TEXT,
  city TEXT,
  region TEXT,
  stripe_id TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  created_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  condition TEXT,
  price REAL NOT NULL,
  currency TEXT,
  fitment TEXT,
  description TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  made_in TEXT,
  image TEXT,
  sold INTEGER DEFAULT 0,
  created_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT,
  status TEXT,
  stripe_session_id TEXT,
  created_at INTEGER,
  FOREIGN KEY(buyer_id) REFERENCES users(id),
  FOREIGN KEY(seller_id) REFERENCES users(id),
  FOREIGN KEY(listing_id) REFERENCES listings(id)
);
`;

// Initialize schema
try {
  db.exec(schema);
} catch (e) {
  if (!e.message.includes('already exists')) throw e;
}

// Seed demo data
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const bcrypt = require('bcryptjs');
  const now = Date.now();

  const seller = db.prepare(`
    INSERT INTO users (name, email, pass_hash, country, city, region, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'John Seller',
    'seller@example.com',
    bcrypt.hashSync('password123', 10),
    'Canada',
    'Toronto',
    'Ontario',
    now
  );

  db.prepare(`
    INSERT INTO listings (user_id, title, category, condition, price, currency, fitment, description, country, city, region, made_in, sold, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    seller.lastInsertRowid,
    'Winter Tires - Michelin Defender',
    'Tires',
    'New',
    450,
    'CAD',
    'Universal 17 inch',
    'Premium winter tires, excellent grip in snow',
    'Canada',
    'Toronto',
    'Ontario',
    'France',
    0,
    now
  );

  db.prepare(`
    INSERT INTO listings (user_id, title, category, condition, price, currency, fitment, description, country, city, region, made_in, sold, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    seller.lastInsertRowid,
    'Brake Pads Set - OEM Quality',
    'Brakes',
    'New',
    85,
    'USD',
    'Honda Civic 2015-2020',
    'OEM replacement pads, low dust formula',
    'USA',
    'Detroit',
    'Michigan',
    'USA',
    0,
    now
  );

  console.log('✅ Demo data seeded');
}

module.exports = db;