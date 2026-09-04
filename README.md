# Auto Parts Market

A North America-wide auto parts marketplace: sellers in Canada and the USA list parts in CAD or USD, buyers browse everything converted to USD with duty estimates and seller locations.

## Features
- Stripe Connect payments
- Duty/tax estimator (USMCA + MFN + GST/HST)
- Listings with photos
- Auth (register/login)
- Messaging
- Saved items
- SQLite database with seed data
- Fully static frontend served by Express

## Quick start

```bash
npm install
npm start
```

Visit: http://localhost:3000

## Deploying on Render

- Add persistent disk at `/data`
- Add environment variables:
  - `DATA_DIR=/data`
  - `FX_CAD_USD=0.73`
  - `PLATFORM_FEE_PCT=10`
  - `APP_URL=https://yourdomain.onrender.com`
  - `STRIPE_SECRET_KEY=`
  - `STRIPE_WEBHOOK_SECRET=`