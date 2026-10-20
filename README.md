# pubkey.locker

Node.js keyserver backed by Oracle Autonomous Database. Stores signed key bundles and serves them by handle.

## Local development

```bash
npm install
cp .env.example .env
# fill .env with Oracle and admin credentials
npm run dev
```

## Environment

Required variables:

- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ORACLE_WALLET_LOCATION`
- `ORACLE_WALLET_PASSWORD`
- `PORT`
- `ADMIN_TOKEN`

Never commit `.env` or the Oracle wallet directory.

## API

- `GET /health`
- `POST /api/validate`
- `POST /api/keys`
- `GET /api/keys/:handle`
- `GET /api/bundles` (admin token required)
- `DELETE /api/keys/:id` (admin token required)

## Deployment

Production runs on an Oracle VM:

- App path: `/opt/pubkey-locker`
- Service: `pubkey-locker`
- Port: `127.0.0.1:3002`
- Caddy terminates TLS and proxies to the app

Deploy steps:

```bash
npm install
sudo cp deploy/pubkey-locker.service /etc/systemd/system/pubkey-locker.service
sudo systemctl daemon-reload
sudo systemctl enable --now pubkey-locker
```

Append `deploy/Caddyfile.snippet` to `/etc/caddy/Caddyfile`, then:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo caddy reload --config /etc/caddy/Caddyfile
```

## Security

- Keep secrets in `.env` only.
- Keep the Oracle wallet outside the repository.
- Rotate credentials if they are exposed.
- Admin endpoints require `X-Admin-Token`.