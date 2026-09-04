# Deployment Guide

## Local Development

```bash
npm install
npm start
```

Visit: `http://localhost:3000`

## Render Deployment

1. **Create a new Render Web Service**
   - Connect your GitHub repo
   - Select `Node` as the runtime
   - Build command: `npm ci`
   - Start command: `npm start`

2. **Add persistent disk**
   - Mount path: `/data`
   - Size: 10GB (adjust as needed)

3. **Set environment variables**
   - `NODE_ENV`: `production`
   - `DATA_DIR`: `/data`
   - `FX_CAD_USD`: `0.73` (or current rate)
   - `PLATFORM_FEE_PCT`: `10`
   - `STRIPE_SECRET_KEY`: (from Stripe dashboard)
   - `STRIPE_WEBHOOK_SECRET`: (from Stripe dashboard)
   - `APP_URL`: `https://yourdomain.onrender.com`
   - `ADMIN_TOKEN`: (generate a secure token)

4. **Deploy via render.yaml**
   ```bash
   git push origin main
   ```
   Render will auto-deploy based on `render.yaml`

## Docker Deployment

```bash
docker build -t auto-parts-market .
docker run -p 3000:3000 \
  -e STRIPE_SECRET_KEY=sk_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -v data:/data \
  auto-parts-market
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATA_DIR` | Database/uploads path | `./` |
| `FX_CAD_USD` | CAD to USD exchange rate | `0.73` |
| `PLATFORM_FEE_PCT` | Platform fee % | `10` |
| `STRIPE_SECRET_KEY` | Stripe API key | _(required)_ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | _(required)_ |
| `APP_URL` | App public URL | `http://localhost:3000` |
| `ADMIN_TOKEN` | Admin panel token | _(optional)_ |

## Database Backups

To backup SQLite database:
```bash
cp /data/data.db /backups/data-$(date +%s).db
```

To restore:
```bash
cp /backups/data-*.db /data/data.db
```

## Monitoring

- **Logs**: Check `/app/logs/` (implement Winston logger)
- **Health check**: `GET /health`
- **Metrics**: Implement Prometheus exporter (optional)

## SSL/TLS

Render provides free SSL certificates automatically. Ensure `APP_URL` uses `https://` in production.