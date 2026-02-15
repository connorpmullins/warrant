import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";
import { createPayout } from "@/lib/stripe";

const { mockRequireAdmin, mockGenerateRevenueEntries } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockGenerateRevenueEntries: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin: mockRequireAdmin };
});

vi.mock("@/services/revenue", () => ({
  generateRevenueEntries: (...args: unknown[]) => mockGenerateRevenueEntries(...args),
}));

import { POST } from "./route";

const ADMIN = { id: "admin-1", email: "admin@example.com", role: "ADMIN" };

describe("POST /api/admin/payouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(ADMIN);
    mockGenerateRevenueEntries.mockResolvedValue(undefined);
    mockPrismaClient.auditLog.create.mockResolvedValue({});
  });

  it("generates revenue entries without executing", async () => {
    const request = new NextRequest("http://localhost/api/admin/payouts", {
      method: "POST",
      body: JSON.stringify({ period: "2025-01" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.generated).toBe(true);
    expect(body.data.executed).toBe(false);
  });

  it("executes payouts when execute=true", async () => {
    mockPrismaClient.revenueEntry.findMany.mockResolvedValueOnce([
      {
        id: "entry-1",
        amount: 5000,
        journalist: { stripeConnectId: "acct_123", userId: "user-1" },
      },
    ]);
    vi.mocked(createPayout).mockResolvedValueOnce("tr_123");
    mockPrismaClient.revenueEntry.update.mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/admin/payouts", {
      method: "POST",
      body: JSON.stringify({ period: "2025-01", execute: true }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.executed).toBe(true);
    expect(body.data.paid).toBe(1);
    expect(body.data.failed).toBe(0);
  });

  it("marks entries as FAILED when journalist has no connect id", async () => {
    mockPrismaClient.revenueEntry.findMany.mockResolvedValueOnce([
      {
        id: "entry-2",
        amount: 3000,
        journalist: { stripeConnectId: null, userId: "user-2" },
      },
    ]);
    mockPrismaClient.revenueEntry.update.mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/admin/payouts", {
      method: "POST",
      body: JSON.stringify({ execute: true }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.data.failed).toBe(1);
    expect(body.data.paid).toBe(0);
  });
});
