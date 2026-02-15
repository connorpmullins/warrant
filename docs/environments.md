# Environments & Configuration

System of record for environment variables, service dependencies, and the three deployment targets.

---

## Three Environments

|                    | **Local**                              | **Staging** (`dev.warrant.ink`) | **Production** (`warrant.ink`) |
| ------------------ | -------------------------------------- | ------------------------------- | ------------------------------ |
| **Hosting**        | `localhost:3000`                       | Vercel Preview                  | Vercel Production              |
| **Database**       | Docker Compose Postgres                | Neon (branch)                   | Neon (production)              |
| **Redis**          | Docker Compose                         | Upstash / Vercel KV             | Upstash / Vercel KV            |
| **Search**         | Docker Compose Meilisearch             | Meilisearch Cloud               | Meilisearch Cloud              |
| **Email**          | Mailpit (Docker, SMTP :1025, UI :8025) | Resend                          | Resend                         |
| **Payments**       | Stripe test mode                       | Stripe test mode                | Stripe live mode               |
| **Blob storage**   | Vercel Blob (requires token)           | Vercel Blob                     | Vercel Blob                    |
| **Env var source** | `.env` file (from `.env.example`)      | Vercel UI / CLI                 | Vercel UI / CLI                |

### Local setup

```bash
cp .env.example .env          # Copy and fill in values
docker compose up -d           # Start Postgres, Redis, Meilisearch, Mailpit
npm run db:push                # Apply Prisma schema
npm run db:seed                # Seed data + sync Meilisearch
npm run dev                    # Start Next.js
```

### Staging / Production

Env vars are managed in the **Vercel dashboard** (or `vercel env add`). The CI workflows pull them at deploy time via `vercel env pull`. **Never run `vercel env pull` into `.env.local`** — it overwrites local Docker-friendly defaults with remote connection strings.

The `.env.vercel` file in the repo root is a reference snapshot of Vercel env var names. It is not loaded by the app.

---

## Environment Variable Inventory

### Required everywhere

| Variable              | Purpose                      | Notes                                                                                          |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | Local: Docker. Remote: Neon. Prisma 7 needs the `pg` adapter, not a raw string.                |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app          | `http://localhost:3000` locally, `https://dev.warrant.ink` staging, `https://warrant.ink` prod |

### Service-specific

| Variable                                            | Service                     | Degradation if missing                                                                                         | Notes                                    |
| --------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `STRIPE_SECRET_KEY`                                 | Stripe payments             | Payments disabled (`isStripeEnabled()` returns false). Subscribe returns mock or 503.                          | Test keys for local + staging.           |
| `STRIPE_WEBHOOK_SECRET`                             | Stripe webhook verification | Webhook signature validation fails (400 on all events)                                                         |                                          |
| `STRIPE_MONTHLY_PRICE_ID`                           | Stripe checkout             | Checkout session creation fails                                                                                |                                          |
| `STRIPE_ANNUAL_PRICE_ID`                            | Stripe checkout             | Checkout session creation fails                                                                                |                                          |
| `STRIPE_IDENTITY_ENABLED`                           | Stripe Identity             | Identity verification unavailable (503 from `/api/profile/verification`)                                       | Set to `"true"` to enable                |
| `RESEND_API_KEY`                                    | Resend email                | Falls back to Mailpit (via `EMAIL_PROVIDER` auto-detection)                                                    | Only needed when `EMAIL_PROVIDER=resend` |
| `EMAIL_PROVIDER`                                    | Email routing               | Auto-selects: `resend` in production, `mailpit` otherwise                                                      | Explicit override available              |
| `EMAIL_FROM`                                        | Sender address              | Default: `noreply@warrant.ink`                                                                                 |                                          |
| `SMTP_HOST` / `SMTP_PORT`                           | Mailpit SMTP                | Only used locally. Defaults: `localhost:1025`                                                                  |                                          |
| `REDIS_URL`                                         | Redis cache + rate limiting | Falls back to `redis://localhost:6379`. **Will crash if Redis is unreachable.**                                |                                          |
| `MEILISEARCH_HOST`                                  | Search                      | Search disabled (all search functions return empty results)                                                    |                                          |
| `MEILISEARCH_API_KEY`                               | Search auth                 | Warning logged, search disabled                                                                                |                                          |
| `BLOB_READ_WRITE_TOKEN`                             | Vercel Blob (image uploads) | Upload returns 503. **Build fails if missing** (enforced by `next.config.ts`).                                 |                                          |
| `ALLOW_MOCK_BILLING`                                | Mock billing bypass         | If `true` + Stripe disabled, subscribe creates mock subscription. Blocked in production unless explicitly set. |                                          |
| `ENABLE_DEV_LOGIN` / `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | Dev login shortcut          | Dev login page hidden + API returns 404. **Both** must be `"true"` for it to work.                             | Double-gated: server + client            |
| `PLATFORM_MARGIN`                                   | Revenue split               | Defaults to `0.15` (15%)                                                                                       | Used by `services/revenue.ts`            |

### CI-only (set in `.github/workflows/`)

| Variable            | Purpose                           |
| ------------------- | --------------------------------- |
| `VERCEL_ORG_ID`     | Vercel deployment (GitHub secret) |
| `VERCEL_PROJECT_ID` | Vercel deployment (GitHub secret) |
| `VERCEL_TOKEN`      | Vercel CLI auth (GitHub secret)   |

---

## Service Degradation Behavior

Not all services are required for the app to start. The codebase uses a **graceful degradation** pattern for optional services:

| Service         | Missing env var         | Behavior                                                                                                                                                   |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stripe**      | `STRIPE_SECRET_KEY`     | `isStripeEnabled()` → `false`. Payments, identity, connect all return 503. Subscribe can use mock billing if `ALLOW_MOCK_BILLING=true`.                    |
| **Meilisearch** | `MEILISEARCH_HOST`      | `meili` export is `null`. Search routes return empty results. Article publish still succeeds (search sync failure is caught and logged).                   |
| **Resend**      | `RESEND_API_KEY`        | Falls back to Mailpit SMTP. In production without either, email sending throws.                                                                            |
| **Vercel Blob** | `BLOB_READ_WRITE_TOKEN` | **Build fails** (`next.config.ts` enforces). Upload route returns 503 at runtime.                                                                          |
| **Redis**       | `REDIS_URL`             | Falls back to `redis://localhost:6379`. If Redis is unreachable, **rate limiting and caching throw** — this can break routes that call `checkRateLimit()`. |

### Key gotcha: environment parity

A feature working locally does not guarantee it works in staging/production. Common failures:

1. **Blob uploads**: `BLOB_READ_WRITE_TOKEN` is set locally but missing in Vercel → build fails or uploads return 503.
2. **Redis**: Docker Compose provides Redis locally, but `REDIS_URL` might not be configured in Vercel → rate limiting crashes.
3. **Search**: Meilisearch runs in Docker locally but no cloud instance is provisioned → search returns empty in staging.
4. **Email**: Mailpit catches all email locally, but `RESEND_API_KEY` missing in staging → magic links never arrive.
5. **Stripe webhooks**: `STRIPE_WEBHOOK_SECRET` differs per environment. Forgetting to update it after re-creating a webhook endpoint → all events rejected.

---

## Adding a New Environment Variable

When a feature requires a new env var, follow this checklist:

1. **Add to `.env.example`** with a descriptive comment, default value (or placeholder), and which environments need it.
2. **Add to `src/test/setup.ts`** if tests need it (set a test-safe default).
3. **Handle absence gracefully in code** — check for the var, log a warning, and degrade or return 503. Never let a missing optional var crash the app.
4. **Add to the inventory table above** in this document.
5. **Set in Vercel** for staging and production (Vercel dashboard → Settings → Environment Variables). If it's a secret, use Vercel's encrypted secrets.
6. **Update CI workflows** if the var is needed at build/test time (add to the `env:` block in the relevant `.github/workflows/*.yml`).
7. **Test in all three environments** — confirm the feature works locally, in staging, and that production at minimum degrades gracefully if the var isn't set yet.
