import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

describe("GET /api/system/integrations", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("reports integration readiness", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("stripe");
    expect(body.data).toHaveProperty("resend");
    expect(body.data).toHaveProperty("redis");
    expect(body.data).toHaveProperty("meilisearch");
  });

  it("reflects environment configuration", async () => {
    process.env["STRIPE_SECRET_KEY"] = "sk_test_123";
    process.env["REDIS_URL"] = "redis://localhost:6379";
    delete process.env["RESEND_API_KEY"];

    const response = await GET();
    const body = await response.json();

    expect(body.data.stripe.configured).toBe(true);
    expect(body.data.redis.configured).toBe(true);
    expect(body.data.resend.configured).toBe(false);
  });
});
