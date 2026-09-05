const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to ensure the user is logged in as a supplier
const requireSupplierAuth = (req, res, next) => {
  // Assuming express-session is used and sets req.session.userId
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Supplier must be logged in.' });
  }
  next();
};

// Route to add a new auto part listing
router.post('/add-item', requireSupplierAuth, (req, res) => {
  const { title, price } = req.body;
  const supplierId = req.session.userId; 

  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required.' });
  }

  db.run(
    `INSERT INTO items (title, price, supplier_id) VALUES (?, ?, ?)`,
    [title, price, supplierId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item listed successfully', itemId: this.lastID });
    }
  );
});

// Route to get supplier earnings and calculate 15% deductions totals
router.get('/supplier/earnings', requireSupplierAuth, (req, res) => {
  const supplierId = req.session.userId;
  
  db.get(
    `SELECT 
       SUM(total_amount) as totalSales, 
       SUM(platform_fee) as totalFee, 
       SUM(supplier_payout) as netPayout 
     FROM transactions 
     WHERE supplier_id = ?`,
    [supplierId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        totalSales: row.totalSales || 0,
        totalFee: row.totalFee || 0,
        netPayout: row.netPayout || 0
      });
    }
  );
});

// Route to fetch all items for the public marketplace
router.get('/items', (req, res) => {
  db.all(`SELECT id, title, price, supplier_id FROM items`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ items: rows });
  });
});

module.exports = router;
