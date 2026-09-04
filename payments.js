const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const db = require('./db');

async function connectUrl(user) {
  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    business_type: 'individual'
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    type: 'account_onboarding',
    refresh_url: `${process.env.APP_URL || 'http://localhost:3000'}/onboarding/refresh`,
    return_url: `${process.env.APP_URL || 'http://localhost:3000'}/onboarding/return`
  });

  db.prepare('UPDATE users SET stripe_id=? WHERE id=?').run(account.id, user.id);

  return { url: link.url };
}

async function checkout(listing, buyer) {
  const seller = db.prepare('SELECT * FROM users WHERE id=?').get(listing.user_id);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: (listing.currency || 'cad').toLowerCase(),
          product_data: {
            name: listing.title,
            images: listing.image ? [`/uploads/${listing.image}`] : []
          },
          unit_amount: Math.round(listing.price * 100)
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${process.env.APP_URL || 'http://localhost:3000'}/success`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/cancel`,
    payment_intent_data: {
      application_fee_amount: Math.round(
        listing.price * (parseFloat(process.env.PLATFORM_FEE_PCT) || 10) / 100 * 100
      ),
      transfer_data: {
        destination: seller.stripe_id
      }
    }
  });

  // Record order
  const now = Date.now();
  db.prepare(`
    INSERT INTO orders (buyer_id, seller_id, listing_id, amount, currency, status, stripe_session_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    buyer.id,
    seller.id,
    listing.id,
    listing.price,
    listing.currency || 'CAD',
    'pending',
    session.id,
    now
  );

  return { sessionId: session.id, url: session.url };
}

function handleWebhook(req) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_dummy';

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (e) {
    return { error: 'Webhook signature verification failed', status: 400 };
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const order = db.prepare('SELECT * FROM orders WHERE stripe_session_id=?').get(session.id);

    if (order) {
      db.prepare('UPDATE orders SET status=? WHERE id=?').run('completed', order.id);
      db.prepare('UPDATE listings SET sold=1 WHERE id=?').run(order.listing_id);
    }
  }

  return { received: true };
}

module.exports = {
  connectUrl,
  checkout,
  handleWebhook
};