import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";

const { mockRequireJournalist, mockGetJournalistRevenue } = vi.hoisted(() => ({
  mockRequireJournalist: vi.fn(),
  mockGetJournalistRevenue: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireJournalist: mockRequireJournalist };
});

vi.mock("@/services/revenue", () => ({
  getJournalistRevenue: (...args: unknown[]) => mockGetJournalistRevenue(...args),
}));

import { GET } from "./route";

describe("GET /api/profile/revenue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireJournalist.mockResolvedValue({
      id: "user-j",
      role: "JOURNALIST",
    });
  });

  it("returns 404 when no journalist profile", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns revenue data", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      id: "profile-1",
      stripeConnectId: "acct_123",
    });
    mockGetJournalistRevenue.mockResolvedValueOnce({
      totalEarnings: 15000,
      entries: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.totalEarnings).toBe(15000);
    expect(body.data.stripeConnectId).toBe("acct_123");
  });
});
