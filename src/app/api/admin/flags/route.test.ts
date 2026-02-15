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
  applyLabel: vi.fn().mockResolvedValue(undefined),
}));

describe("PATCH /api/admin/flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when flag is missing", async () => {
    mockPrismaClient.flag.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/admin/flags", {
      method: "PATCH",
      body: JSON.stringify({
        flagId: "550e8400-e29b-41d4-a716-446655440000",
        status: "UPHELD",
      }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Flag not found");
  });
});
