# Testing

System of record for test conventions, mock patterns, and verification workflows.

---

## Test Structure

Tests are **co-located** with the code they test:

```
src/lib/auth.ts           -> src/lib/auth.test.ts
src/services/integrity.ts -> src/services/integrity.test.ts
src/app/api/flags/route.ts -> src/app/api/flags/route.test.ts
```

E2E tests live in the top-level `e2e/` directory and use Playwright.

---

## Running Tests

```bash
# All unit tests
npm test

# Single file
npx vitest run src/path/to/file.test.ts

# Watch mode
npm run test:watch

# With coverage
npx vitest run --coverage

# E2E tests (requires running app + services)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## Mock Setup

All external dependencies are mocked via `src/test/setup.ts`, which is loaded automatically by vitest (`setupFiles` in `vitest.config.ts`).

Mocked dependencies:

- **Prisma** (`@prisma/client`, `@/lib/db`) -- `mockPrismaClient` with all model methods as `vi.fn()`
- **Redis** (`@/lib/redis`) -- `mockRedis` plus `cacheGet`, `cacheSet`, `cacheDel`, `checkRateLimit`
- **Next.js** (`next/headers`, `next/navigation`) -- cookies, headers, redirect, useRouter
- **Audit** (`@/lib/audit`) -- `auditLog` as no-op
- **Search** (`@/lib/search`) -- all search functions as no-ops
- **Email** (`@/lib/email`) -- `sendEmail`, `sendMagicLinkEmail` as no-ops
- **Stripe** (`@/lib/stripe`) -- all Stripe helpers as `vi.fn()`

### Adding New Mocks

When adding a new Prisma model, add its methods to `mockPrismaClient` in `src/test/setup.ts`. When adding a new lib module with external dependencies, add a `vi.mock()` block in the same file.

---

## Test Patterns

Every test file should cover:

1. **Happy path** -- the normal success case
2. **Validation errors** -- invalid input rejected with correct status code
3. **Auth checks** -- unauthenticated/unauthorized requests rejected
4. **Boundary conditions** -- zero values, max values, empty arrays, edge cases
5. **Error handling** -- database failures, external service failures

### API Route Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient, mockCookieStore } from "@/test/setup";

// Import AFTER mocks are set up
import { POST } from "./route";

describe("POST /api/example", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds with valid input", async () => {
    // Arrange: set up mock auth + mock DB responses
    mockCookieStore.get.mockReturnValue({ value: "a".repeat(64) });
    mockPrismaClient.session.findUnique.mockResolvedValueOnce({
      /* session */
    });
    mockPrismaClient.user.findUnique.mockResolvedValueOnce({
      /* user */
    });

    // Act
    const request = new Request("http://localhost/api/example", {
      method: "POST",
      body: JSON.stringify({
        /* valid body */
      }),
    });
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("rejects unauthenticated requests", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const request = new Request("http://localhost/api/example", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
```

---

## Coverage

Coverage is configured in `vitest.config.ts` using the `v8` provider:

```
include: ["src/lib/**", "src/services/**", "src/app/api/**"]
exclude: ["src/test/**", "**/*.d.ts"]
```

Coverage thresholds are enforced in CI. Run `npx vitest run --coverage` locally to check before pushing.

---

## E2E Tests

Playwright E2E specs live in `e2e/` and cover full user flows against a running app. See [e2e-runbook.md](./e2e-runbook.md) for the complete flow descriptions.

Key files:

- `e2e/helpers/auth.ts` -- login helpers using the test auth endpoint
- `e2e/reader-flow.spec.ts` -- reader + paywall + subscribe flows
- `e2e/journalist-flow.spec.ts` -- journalist dashboard, write, publish, corrections
- `e2e/admin-flow.spec.ts` -- admin moderation flows
