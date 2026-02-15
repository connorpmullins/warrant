import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";
import { isStripeEnabled, createBillingPortalSession } from "@/lib/stripe";

const { mockRequireAuth } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAuth: mockRequireAuth };
});

import { POST } from "./route";

describe("POST /api/subscribe/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: "user-1", role: "READER" });
    vi.mocked(isStripeEnabled).mockReturnValue(true);
  });

  it("returns 503 when Stripe is not enabled", async () => {
    vi.mocked(isStripeEnabled).mockReturnValueOnce(false);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toContain("unavailable");
  });

  it("returns 404 when no billing account exists", async () => {
    mockPrismaClient.subscription.findUnique.mockResolvedValueOnce(null);

    const response = await POST();
    expect(response.status).toBe(404);
  });

  it("returns portal URL on success", async () => {
    mockPrismaClient.subscription.findUnique.mockResolvedValueOnce({
      stripeCustomerId: "cus_123",
    });
    vi.mocked(createBillingPortalSession).mockResolvedValueOnce(
      "https://billing.stripe.com/session/123"
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("stripe.com");
  });

  it("returns 500 when portal creation fails", async () => {
    mockPrismaClient.subscription.findUnique.mockResolvedValueOnce({
      stripeCustomerId: "cus_123",
    });
    vi.mocked(createBillingPortalSession).mockResolvedValueOnce(null);

    const response = await POST();
    expect(response.status).toBe(500);
  });
});
