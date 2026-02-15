import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";

const { mockRequireAdmin } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin: mockRequireAdmin };
});

import { GET } from "./route";

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    mockPrismaClient.user.count.mockResolvedValue(100);
    mockPrismaClient.journalistProfile.count.mockResolvedValue(10);
    mockPrismaClient.article.count.mockResolvedValue(50);
    mockPrismaClient.flag.count.mockResolvedValue(3);
    mockPrismaClient.dispute.count.mockResolvedValue(1);
    mockPrismaClient.subscription.count.mockResolvedValue(25);
  });

  it("returns platform statistics", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.users).toBeDefined();
    expect(body.data.content).toBeDefined();
    expect(body.data.moderation).toBeDefined();
    expect(body.data.revenue).toBeDefined();
  });
});
