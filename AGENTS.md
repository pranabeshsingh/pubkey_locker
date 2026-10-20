# pubkey.locker

- VM-ready Node app using Oracle Autonomous Database (26ai, Transaction Processing) and Caddy.
- App runs on `127.0.0.1:3002`; Caddy terminates TLS and redirects apex/canonical host.
- Secrets live only in `/opt/pubkey-locker/.env` on the VM; never commit them.
- Oracle wallet lives in `/opt/pubkey-locker/wallet` on the VM; never commit it.
- Commands:
  - Install: `npm install`
  - Dev: `npm run dev`
  - Start: `npm start`
  - Test: `npm test`
- Deploy files: `deploy/pubkey-locker.service`, `deploy/Caddyfile.snippet`.
- Required env: `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`, `ORACLE_WALLET_LOCATION`, `ORACLE_WALLET_PASSWORD`, `PORT`, `ADMIN_TOKEN`.
- Existing services use ports 3000 and 3001; do not touch them.
- Deployment target: Oracle VM `129.225.105.118`, app path `/opt/pubkey-locker`, systemd service `pubkey-locker`.
- Cloudflare DNS must set `pubkey.locker` and `www.pubkey.locker` A records to `129.225.105.118` with proxy disabled (DNS only) so Caddy can provision TLS.
- Caddy config is appended to `/etc/caddy/Caddyfile`; validate with `caddy validate` and reload, never restart.
- No commits yet; default branch is `master`; origin is `git@github.com:pranabeshsingh/pubkey_locker.git`.