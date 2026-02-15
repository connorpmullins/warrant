import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { mockPrismaClient } from "@/test/setup";
import { isStripeEnabled, retrieveCheckoutSession } from "@/lib/stripe";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "READER",
    }),
  };
});

vi.mock("@/lib/stripe", () => ({
  isStripeEnabled: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
}));

describe("GET /api/subscribe/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isStripeEnabled).mockReturnValue(true);
  });

  it("returns session when it belongs to the authenticated user", async () => {
    mockPrismaClient.subscription.findUnique.mockResolvedValueOnce({
      stripeCustomerId: "cus_123",
    });
    vi.mocked(retrieveCheckoutSession).mockResolvedValueOnce({
      plan: "month",
      status: "active",
      customerId: "cus_123",
      customerEmail: "user@example.com",
      currentPeriodEnd: new Date("2026-03-01"),
    });

    const request = new NextRequest(
      "http://localhost/api/subscribe/session?session_id=cs_123"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.customerId).toBe("cus_123");
  });

  it("returns 404 when session belongs to another customer", async () => {
    mockPrismaClient.subscription.findUnique.mockResolvedValueOnce({
      stripeCustomerId: "cus_abc",
    });
    vi.mocked(retrieveCheckoutSession).mockResolvedValueOnce({
      plan: "month",
      status: "active",
      customerId: "cus_other",
      customerEmail: "other@example.com",
      currentPeriodEnd: new Date("2026-03-01"),
    });

    const request = new NextRequest(
      "http://localhost/api/subscribe/session?session_id=cs_123"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });
});
