import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";
import { createVerificationSession } from "@/lib/stripe";

const { mockRequireJournalist } = vi.hoisted(() => ({
  mockRequireJournalist: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireJournalist: mockRequireJournalist };
});

import { POST } from "./route";

describe("POST /api/profile/verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireJournalist.mockResolvedValue({
      id: "user-j",
      role: "JOURNALIST",
    });
  });

  it("returns 404 when no journalist profile", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce(null);

    const response = await POST();
    expect(response.status).toBe(404);
  });

  it("returns 400 when already verified", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      id: "p-1",
      verificationStatus: "VERIFIED",
      stripeVerificationId: "vs_123",
    });

    const response = await POST();
    expect(response.status).toBe(400);
  });

  it("returns 503 when Stripe Identity not configured", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      id: "p-1",
      verificationStatus: "PENDING",
      stripeVerificationId: null,
    });
    vi.mocked(createVerificationSession).mockResolvedValueOnce(null);

    const response = await POST();
    expect(response.status).toBe(503);
  });

  it("creates verification session and returns URL", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      id: "p-1",
      verificationStatus: "PENDING",
      stripeVerificationId: null,
    });
    vi.mocked(createVerificationSession).mockResolvedValueOnce({
      id: "vs_new",
      url: "https://verify.stripe.com/session",
    } as never);
    mockPrismaClient.journalistProfile.update.mockResolvedValue({});

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("stripe.com");
    expect(body.data.sessionId).toBe("vs_new");
  });
});
