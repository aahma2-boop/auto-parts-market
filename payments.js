const db = require('./db');

/**
 * Processes a transaction, calculating the 15% platform fee
 * and 85% supplier payout, then logging it in the database.
 */
function processTransaction(itemPrice, supplierId, buyerId, itemId) {
  return new Promise((resolve, reject) => {
    const platformFee = itemPrice * 0.15; // 15% cut for the marketplace
    const supplierPayout = itemPrice * 0.85; // 85% remaining for the supplier

    db.run(
      `INSERT INTO transactions (item_id, buyer_id, supplier_id, total_amount, platform_fee, supplier_payout) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [itemId, buyerId, supplierId, itemPrice, platformFee, supplierPayout],
      function(err) {
        if (err) {
          console.error('Error logging transaction:', err);
          return reject(err);
        }
        
        // Return transaction details for further gateway processing (e.g., Stripe Connect)
        resolve({
          transactionId: this.lastID,
          status: 'success',
          grossAmount: itemPrice,
          platformFee: platformFee,
          netPayout: supplierPayout
        });
      }
    );
  });
}

module.exports = { processTransaction };
