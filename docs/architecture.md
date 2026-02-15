# Architecture

System of record for project structure, key files, data flows, and known quirks.

---

## Layers

```
src/
├── app/              Next.js App Router
│   ├── api/          REST API route handlers (the HTTP boundary)
│   └── ...           Pages (SSR + client components)
├── components/       React components
│   ├── ui/           shadcn/ui primitives
│   ├── layout/       Header, footer, nav
│   ├── article/      Article-related components
│   └── editor/       Tiptap rich text editor
├── lib/              Infrastructure layer (DB, auth, cache, email, payments, search)
├── services/         Business logic (integrity, distribution, revenue)
└── test/             Test setup and utilities
```

**Data flows top-down**: `app/api` routes call `services/` for business logic, which call `lib/` for infrastructure. Components render data fetched from API routes.

---

## Key Files

| File                           | Purpose                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `src/lib/db.ts`                | Prisma client with `pg` driver adapter (required for Prisma 7)                |
| `src/lib/auth.ts`              | Magic link creation, verification, session management                         |
| `src/lib/api.ts`               | `successResponse()`, `errorResponse()`, `handleApiError()` helpers            |
| `src/lib/validations.ts`       | Zod schemas for all API input validation                                      |
| `src/lib/email.ts`             | Dual provider (Resend prod / Mailpit dev), auto-detects via `NODE_ENV`        |
| `src/lib/stripe.ts`            | Stripe client + checkout/portal/identity/connect/webhook helpers              |
| `src/lib/search.ts`            | Meilisearch sync, indexing, and search operations                             |
| `src/lib/redis.ts`             | Redis cache + rate limiting (sliding window)                                  |
| `src/lib/audit.ts`             | `auditLog()` for recording sensitive actions                                  |
| `src/middleware.ts`            | Security headers, CSRF protection, session shape validation, route protection |
| `src/services/integrity.ts`    | Reputation scoring, source assessment, content risk assessment                |
| `src/services/distribution.ts` | Feed ranking algorithm (reputation-weighted)                                  |
| `src/services/revenue.ts`      | Revenue calculation with Gini coefficient, read-based allocation              |
| `prisma/schema.prisma`         | Full database schema                                                          |

---

## Core Data Flows

### Publish

1. Journalist calls `POST /api/articles` to create/save a draft.
2. Journalist calls `POST /api/articles/[id]/publish`.
3. Publish route calls `assessSourceCompleteness()` and `assessContentRisk()` from `services/integrity.ts`.
4. If high-risk, article is held (`status: HELD`); otherwise published.
5. Reputation events recorded, integrity labels applied if sourcing is incomplete.
6. Article synced to Meilisearch via `syncArticleInSearch()`.

### Subscribe

1. Reader calls `POST /api/subscribe` with plan selection.
2. Route creates a Stripe Checkout session via `lib/stripe.ts`.
3. On payment, Stripe fires `checkout.session.completed` webhook to `/api/webhooks/stripe`.
4. Webhook handler updates subscription status in DB.

### Flag / Dispute

1. Reader calls `POST /api/flags` with article ID and reason.
2. Admin reviews via `PATCH /api/admin/flags` (uphold/dismiss).
3. If upheld, reputation penalty applied via `recordReputationEvent()`.
4. Journalist can dispute via `POST /api/disputes`; admin resolves.

---

## Known Quirks

- **Prisma 7 requires `pg` adapter** -- Cannot just pass a connection string; must create a `Pool` then `PrismaPg(pool)`. See `src/lib/db.ts`.
- **Zod v4** -- Uses `.issues` not `.errors` for validation error access.
- **Next.js 16** -- `useSearchParams()` must be wrapped in `<Suspense>`; shows "proxy" deprecation warning for middleware (still works).
- **`tsconfig.json` excludes** -- Test files + seed script excluded from Next.js build to avoid type conflicts.
- **Email provider auto-detection** -- Defaults to `resend` in production, `mailpit` in development (via `NODE_ENV`).

---

## Dev Login

Visit `http://localhost:3000/auth/dev-login` to instantly log in as any seeded account (admin, journalist, reader) with one click. No email or magic link needed.

- Double-gated: page renders "Not available" in production, and the backing API (`/api/auth/login/test`) returns 404 in production.
- After `db:reset`, the seed prints cookie-ready session tokens to the console for manual curl testing.

---

## Commands

```bash
# Local dev
docker compose up -d    # Start Postgres, Redis, Meilisearch, Mailpit
npm run dev             # Start Next.js dev server
npm run db:push         # Push schema to database
npm run db:reset        # Reset + re-seed database
npm run db:seed         # Seeds DB + syncs Meilisearch

# Quality checks
npm run lint            # ESLint
npx tsc --noEmit        # Type check
npm test                # Unit tests (vitest)
npm run test:e2e        # Playwright E2E tests
npm run check           # All of the above in sequence

# Deploy
npx vercel deploy --prod
```

---

## Services

| Service         | Dev              | Production                    |
| --------------- | ---------------- | ----------------------------- |
| **PostgreSQL**  | Docker Compose   | Neon (via Vercel Marketplace) |
| **Redis**       | Docker Compose   | Not yet provisioned           |
| **Meilisearch** | Docker Compose   | Not yet provisioned           |
| **Email**       | Mailpit (Docker) | Resend                        |
| **Payments**    | Stripe test mode | Stripe live mode              |
| **Hosting**     | localhost:3000   | Vercel                        |
