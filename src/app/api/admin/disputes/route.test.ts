import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "./route";
import { mockPrismaClient } from "@/test/setup";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAdmin: vi.fn().mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
    }),
  };
});

vi.mock("@/services/integrity", () => ({
  recordReputationEvent: vi.fn().mockResolvedValue(undefined),
  removeLabel: vi.fn().mockResolvedValue(undefined),
}));

describe("PATCH /api/admin/disputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when dispute is missing", async () => {
    mockPrismaClient.dispute.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/admin/disputes", {
      method: "PATCH",
      body: JSON.stringify({
        disputeId: "550e8400-e29b-41d4-a716-446655440000",
        status: "UPHELD",
        resolution: "Reviewed and upheld by moderation.",
      }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Dispute not found");
  });
});
