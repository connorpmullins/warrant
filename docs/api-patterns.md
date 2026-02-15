# API Route Patterns

System of record for API route conventions, error handling, authentication, and audit practices.

---

## Standard Route Structure

Every API route handler follows this pattern:

```typescript
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { someSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await requireAuth();

    // 2. Parse and validate input
    const body = await request.json();
    const data = someSchema.parse(body);

    // 3. Business logic
    const result = await db.example.create({ data: { ... } });

    // 4. Audit state changes
    await auditLog({
      userId: user.id,
      action: "example_created",
      entity: "Example",
      entityId: result.id,
    });

    // 5. Return success
    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## Authentication

Use helpers from `src/lib/auth.ts`:

| Helper                | Use when                                                      |
| --------------------- | ------------------------------------------------------------- |
| `requireAuth()`       | Any authenticated user                                        |
| `requireJournalist()` | Journalist or admin only                                      |
| `requireAdmin()`      | Admin only                                                    |
| `requireRole(role)`   | Specific role (admin always passes)                           |
| `getSession()`        | Check auth without throwing (returns null if unauthenticated) |

These throw `AuthError` on failure, which `handleApiError()` converts to a 401/403 response.

---

## Input Validation

All API inputs are validated with Zod schemas from `src/lib/validations.ts`.

- Call `schema.parse(body)` -- throws `ZodError` on failure.
- `handleApiError()` automatically converts `ZodError` to a 400 response with human-readable messages.
- Never trust raw `request.json()` without validation.

---

## Response Helpers

From `src/lib/api.ts`:

| Helper                            | Returns                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| `successResponse(data, status?)`  | `{ success: true, data }` with status (default 200)            |
| `errorResponse(message, status?)` | `{ success: false, error: message }` with status (default 400) |
| `handleApiError(error)`           | Dispatches to correct response based on error type             |

`handleApiError` handles:

- `AuthError` -> 401/403
- `ZodError` -> 400 with field messages
- Generic `Error` -> 500 (message hidden in production)

---

## Audit Logging

Every state-changing operation must call `auditLog()` from `src/lib/audit.ts`:

```typescript
await auditLog({
  userId: user.id,         // Who did it (optional for system actions)
  action: "article_published",  // What happened
  entity: "Article",       // What type of thing
  entityId: article.id,    // Which one
  details: { ... },        // Extra context (optional)
});
```

---

## Rate Limiting

Sensitive endpoints use `checkRateLimit()` from `src/lib/redis.ts`:

```typescript
import { checkRateLimit } from "@/lib/redis";

const rateCheck = await checkRateLimit(`login:${email}`, 5, 900);
if (!rateCheck.allowed) {
  return errorResponse("Too many attempts. Try again later.", 429);
}
```

---

## Reference Implementations

Well-tested routes to use as patterns:

- **CRUD with auth**: `src/app/api/articles/route.ts` + `src/app/api/articles/route.test.ts`
- **Admin action**: `src/app/api/admin/flags/route.ts` + `src/app/api/admin/flags/route.test.ts`
- **Webhook handler**: `src/app/api/webhooks/stripe/route.ts`
- **Validation-heavy**: `src/app/api/corrections/route.ts` + `src/app/api/corrections/route.test.ts`
