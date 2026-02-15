import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";
import {
  createConnectAccount,
  createConnectOnboardingLink,
  getConnectAccountStatus,
} from "@/lib/stripe";

const { mockRequireJournalist } = vi.hoisted(() => ({
  mockRequireJournalist: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireJournalist: mockRequireJournalist };
});

import { GET, POST } from "./route";

const JOURNALIST = { id: "user-j", email: "j@example.com", role: "JOURNALIST" };

describe("GET /api/profile/connect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireJournalist.mockResolvedValue(JOURNALIST);
  });

  it("returns not connected when no stripe connect id", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      stripeConnectId: null,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.connected).toBe(false);
  });

  it("returns account status when connected", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      stripeConnectId: "acct_123",
    });
    vi.mocked(getConnectAccountStatus).mockResolvedValueOnce({
      id: "acct_123",
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.connected).toBe(true);
    expect(body.data.payoutsReady).toBe(true);
  });
});

describe("POST /api/profile/connect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireJournalist.mockResolvedValue(JOURNALIST);
  });

  it("returns 404 when profile not found", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce(null);

    const response = await POST();
    expect(response.status).toBe(404);
  });

  it("returns 403 when not verified", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      id: "p-1",
      verificationStatus: "PENDING",
      stripeConnectId: null,
    });

    const response = await POST();
    expect(response.status).toBe(403);
  });

  it("creates connect account and returns onboarding link", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      id: "p-1",
      verificationStatus: "VERIFIED",
      stripeConnectId: null,
    });
    vi.mocked(createConnectAccount).mockResolvedValueOnce("acct_new");
    mockPrismaClient.journalistProfile.update.mockResolvedValue({});
    vi.mocked(createConnectOnboardingLink).mockResolvedValueOnce(
      "https://connect.stripe.com/onboard"
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toContain("stripe.com");
    expect(body.data.accountId).toBe("acct_new");
  });
});
