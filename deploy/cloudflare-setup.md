# Cloudflare Setup Guide — PingToMe

Step-by-step guide for configuring Cloudflare DNS, KV namespaces, Workers, and R2 storage for the PingToMe platform.

---

## Prerequisites

- A Cloudflare account with the `pingto.me` domain added
- `wrangler` CLI installed (`npm install -g wrangler`)
- Authenticated wrangler session (`npx wrangler login`)
- Access to the PingToMe GitHub repository

---

## 1. DNS Records

Configure DNS records in the Cloudflare dashboard under **DNS → Records** for the `pingto.me` zone.

Replace `YOUR_VPS_IP` with the IP address of your VPS / Coolify host.

### Required Records

| Type  | Name         | Content        | Proxy | Purpose                           |
| ----- | ------------ | -------------- | ----- | --------------------------------- |
| A     | `@`          | `YOUR_VPS_IP`  | ✅    | Main site (pingto.me)             |
| A     | `www`        | `YOUR_VPS_IP`  | ✅    | WWW redirect → pingto.me          |
| A     | `api`        | `YOUR_VPS_IP`  | ✅    | Backend API (api.pingto.me)       |
| A     | `uat`        | `YOUR_VPS_IP`  | ✅    | UAT frontend (uat.pingto.me)      |
| A     | `uat-api`    | `YOUR_VPS_IP`  | ✅    | UAT API (uat-api.pingto.me)       |
| TXT   | `_dmarc`     | (see DMARC)    | —     | Email authentication              |

### Notes

- **Proxy status (orange cloud)**: Enable Cloudflare proxy for all A records. This provides DDoS protection, CDN caching, and SSL termination at the edge.
- **SSL mode**: Set to **Full (Strict)** in **SSL/TLS → Overview**. Your origin server must have a valid SSL cert (Let's Encrypt or Coolify-managed).
- **DNS propagation**: Changes take effect within seconds with Cloudflare proxy enabled.

### DMARC / Email (optional but recommended)

If sending transactional email from `noreply@pingto.me`, add SPF, DKIM, and DMARC records as provided by your email service (Resend, Mailgun, SES, etc.).

---

## 2. KV Namespaces

Cloudflare KV stores cached link data for the edge redirector. Create separate namespaces for each environment.

### Create Namespaces via Dashboard

1. Go to **Workers & Pages → KV**
2. Click **Create a namespace**
3. Create two namespaces:

| Namespace Name       | Environment | Used In (`wrangler.toml`) |
| -------------------- | ----------- | ------------------------- |
| `pingtome-uat-links` | UAT         | `[env.uat]`               |
| `pingtome-prod-links`| Production  | `[env.production]`        |

### Create Namespaces via CLI

```bash
# UAT namespace
npx wrangler kv:namespace create "LINKS_KV" --env uat
# Output: { binding = "LINKS_KV", id = "abc123..." }

# Production namespace
npx wrangler kv:namespace create "LINKS_KV" --env production
# Output: { binding = "LINKS_KV", id = "def456..." }
```

### Update `wrangler.toml`

After creating namespaces, update the KV namespace IDs in `apps/redirector/wrangler.toml`:

```toml
# UAT — replace the placeholder ID
[[env.uat.kv_namespaces]]
binding = "LINKS_KV"
id = "ACTUAL_UAT_KV_NAMESPACE_ID"     # <-- paste from wrangler output
preview_id = "ACTUAL_UAT_KV_NAMESPACE_ID"

# Production — replace the placeholder ID
[[env.production.kv_namespaces]]
binding = "LINKS_KV"
id = "ACTUAL_PROD_KV_NAMESPACE_ID"    # <-- paste from wrangler output
preview_id = "ACTUAL_PROD_KV_NAMESPACE_ID"
```

**Current placeholder values** in the repository are `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` — these MUST be replaced before deploying.

---

## 3. R2 Storage Buckets

R2 stores uploaded assets (QR code images, bio page uploads, logos).

### Create Buckets

```bash
# UAT bucket
npx wrangler r2 bucket create pingtome-uat

# Production bucket
npx wrangler r2 bucket create pingtome-prod
```

### Generate R2 API Tokens

1. Go to **R2 → Manage R2 API Tokens**
2. Click **Create API token**
3. Permissions: **Object Read & Write**
4. Specify bucket: `pingtome-uat` (repeat for `pingtome-prod`)
5. Save the **Access Key ID** and **Secret Access Key** — these go in your environment templates.

---

## 4. Deploy the Redirector Worker

The redirector is a Cloudflare Worker that handles URL shortening redirects at the edge for sub-millisecond response times.

### First-Time Setup

```bash
cd apps/redirector

# Authenticate (if not already done)
npx wrangler login
```

### Deploy to UAT

```bash
# From the project root
cd apps/redirector
npx wrangler deploy --env uat
```

This deploys the worker configured under `[env.uat]` in `wrangler.toml`, which routes `uat.pingto.me/*` requests through the worker.

### Deploy to Production

```bash
cd apps/redirector
npx wrangler deploy --env production
```

This deploys the worker configured under `[env.production]`, routing `pingto.me/*` and `*.pingto.me/*`.

### Verify Deployment

```bash
# Check the deployed worker
npx wrangler deployments list --env production

# Test a redirect (after seeding link data)
curl -v https://pingto.me/test-slug
# Should return 301/302 redirect to the target URL
```

---

## 5. Custom Domain for Short URLs

By default, short links use the main `pingto.me` domain (e.g., `pingto.me/abc123`). The redirector Worker intercepts these requests before they reach nginx.

### How It Works

The Cloudflare Worker route `pingto.me/*` in `wrangler.toml` captures ALL requests to the root domain. The Worker:

1. Checks KV cache for the slug
2. If found → redirects to the long URL (301/302)
3. If not found → falls through to the origin (Next.js frontend)

This means:
- `pingto.me/abc123` → redirect (handled by Worker)
- `pingto.me/dashboard` → not a short link → falls through to Next.js
- `pingto.me/` → homepage → falls through to Next.js

### Alternative: Dedicated Short Domain

If you prefer a separate short domain (e.g., `r.pingto.me` or a completely different domain like `ptm.io`):

1. **Add the domain to Cloudflare** (if it's a different domain)
2. **Create a KV namespace** for the short domain
3. **Add route in `wrangler.toml`**:

```toml
[[routes]]
pattern = "r.pingto.me/*"
zone_name = "pingto.me"
```

4. **Update the frontend** to generate short URLs with the new domain
5. **Deploy** the updated worker

---

## 6. Cloudflare Settings Checklist

### SSL/TLS

- [ ] **SSL Mode**: Full (Strict) — origin must have valid SSL cert
- [ ] **Always Use HTTPS**: Enabled
- [ ] **Automatic HTTPS Rewrites**: Enabled
- [ ] **Minimum TLS Version**: 1.2
- [ ] **TLS 1.3**: Enabled

### Speed

- [ ] **Auto Minify**: JavaScript, CSS, HTML (all enabled)
- [ ] **Brotli**: Enabled
- [ ] **Early Hints**: Enabled (helps with Next.js resource loading)
- [ ] **Rocket Loader**: Disabled (can interfere with Next.js hydration)

### Security

- [ ] **Security Level**: Medium (adjust based on threat level)
- [ ] **Bot Fight Mode**: Enabled
- [ ] **Browser Integrity Check**: Enabled
- [ ] **Challenge Passage**: 30 minutes
- [ ] **Rate Limiting**: Configure in WAF rules if needed (supplements nginx rate limiting)

### Caching

- [ ] **Caching Level**: Standard
- [ ] **Browser Cache TTL**: Respect Existing Headers (let nginx/Next.js control)
- [ ] **Always Online**: Enabled (serves cached version if origin is down)

### Page Rules (optional)

Consider these Page Rules for performance:

| URL Pattern              | Setting                          |
| ------------------------ | -------------------------------- |
| `pingto.me/_next/static/*` | Cache Level: Cache Everything, Edge Cache TTL: 1 month |
| `api.pingto.me/*`        | Cache Level: Bypass              |
| `uat.pingto.me/*`        | Cache Level: Bypass (staging)    |

---

## 7. Coolify Integration Notes

If using [Coolify](https://coolify.io/) for deployment:

- **SSL**: Coolify can auto-generate Let's Encrypt certs. If Coolify manages SSL, you can set Cloudflare SSL to **Full** (not Strict) if Coolify uses self-signed certs, or keep **Full (Strict)** if Coolify provisions valid certs.
- **Ports**: Coolify maps container ports to host ports. Ensure the nginx upstream ports (3001, 3010) match the Coolify-exposed ports.
- **Environment variables**: Use Coolify's environment variable editor to paste values from the env templates. Never store `.env` files in the container image.
- **Deploy hooks**: Configure Coolify to run database migrations on deploy:
  ```bash
  pnpm --filter @pingtome/database db:push
  ```
- **Health checks**: Coolify can hit `/health` endpoints for liveness probes. Add these to your Coolify service configuration.

---

## 8. Verification Checklist

After completing setup:

- [ ] DNS records resolve correctly: `dig pingto.me`, `dig api.pingto.me`, etc.
- [ ] SSL certificates are valid for all subdomains
- [ ] KV namespaces created and IDs updated in `wrangler.toml`
- [ ] R2 buckets created and credentials configured in env templates
- [ ] Redirector Worker deployed to UAT and production
- [ ] Short URL redirects work: create a test link and visit it
- [ ] Real-time analytics WebSocket connects (`/analytics/realtime`)
- [ ] API health check responds: `curl https://api.pingto.me/health`
- [ ] Frontend loads: `curl https://pingto.me`
- [ ] Rate limiting works: send rapid requests and verify 429 responses
