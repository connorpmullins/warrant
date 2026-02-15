# Agent Instructions — Warrant

> This is the single source of truth for AI agents (Cursor, Codex, Claude Code).
> CLAUDE.md and .cursor/rules/ are thin pointers to this file.

---

## Verification Commands

**Always run after making changes:**

```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript type check
npm test              # Vitest unit tests
npm run check         # All of the above in sequence
```

If any command fails, fix before committing.

---

## Critical Invariants

1. **Every API route must have a co-located `.test.ts` file.** If you create or modify a route, create or update its test.
2. **Changes to `src/services/integrity.ts`, `revenue.ts`, or `distribution.ts`** require reading `docs/integrity-model.md` first and adding boundary-condition tests.
3. **All API inputs validated with Zod** — schemas live in `src/lib/validations.ts`.
4. **All state changes audited** — call `auditLog()` from `src/lib/audit.ts`.
5. **Never commit with `--no-verify`.**
6. **Never use `any` without a comment** explaining why (usually Prisma transaction callbacks).

---

## Project Topology

```
src/app/api/     → HTTP boundary (routes). Validates input, calls services/lib.
src/services/    → Business logic (integrity scoring, distribution, revenue).
src/lib/         → Infrastructure (DB, auth, cache, email, payments, search).
src/components/  → React UI components (shadcn/ui based).
```

Data flows top-down: routes → services → lib → external deps.

---

## Deep Docs (read on demand)

| Topic                                           | File                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Architecture, key files, known quirks, commands | [docs/architecture.md](docs/architecture.md)                     |
| Test conventions, mock setup, patterns          | [docs/testing.md](docs/testing.md)                               |
| API route structure, auth, validation, audit    | [docs/api-patterns.md](docs/api-patterns.md)                     |
| Integrity model (reputation, scoring, labels)   | [docs/integrity-model.md](docs/integrity-model.md)               |
| E2E browser test runbook                        | [docs/e2e-runbook.md](docs/e2e-runbook.md)                       |
| Product requirements                            | [docs/product-requirements.md](docs/product-requirements.md)     |
| Roadmap and current status                      | [docs/roadmap.md](docs/roadmap.md)                               |
| Observability proposal                          | [docs/observability-proposal.md](docs/observability-proposal.md) |

---

## Common Workflows

### Adding a new API route

1. Create `src/app/api/<path>/route.ts` following the pattern in `docs/api-patterns.md`.
2. Add Zod schema to `src/lib/validations.ts`.
3. Create `route.test.ts` alongside it — cover happy path, validation, auth, errors.
4. Run `npm run check`.

### Adding a new Prisma model

1. Update `prisma/schema.prisma`.
2. Run `npm run db:push` to apply.
3. Add mock methods to `src/test/setup.ts` in `mockPrismaClient`.
4. Run `npm run check`.

### Working with the integrity system

1. Read `docs/integrity-model.md` first.
2. Check existing tests in `src/services/integrity.test.ts`.
3. Add boundary-condition tests for any new scoring logic.
4. Run `npm run check`.

---

## Tech Stack Quick Reference

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma 7 (requires `pg` adapter — see `src/lib/db.ts`)
- **Cache**: Redis (rate limiting + caching)
- **Search**: Meilisearch
- **Payments**: Stripe (subscriptions, identity, connect)
- **Email**: Resend (production) / Mailpit (development)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Vercel
