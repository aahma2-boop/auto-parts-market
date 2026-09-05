const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize database connection
const dbPath = path.resolve(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err.message);
});

db.serialize(() => {
  // Create Users table to establish supplier identities
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'buyer' -- 'buyer', 'supplier', or 'admin'
  )`);

  // Create Items table linked to the supplier
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    supplier_id INTEGER NOT NULL,
    FOREIGN KEY(supplier_id) REFERENCES users(id)
  )`);

  // Create Transactions table to track the 15% platform cut and 85% payout
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    platform_fee REAL NOT NULL,
    supplier_payout REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(supplier_id) REFERENCES users(id)
  )`);
});

module.exports = db;
