import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient } from "@/test/setup";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, getSession: mockGetSession };
});

import { GET } from "./route";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns user data when authenticated", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1" },
      sessionId: "sess-1",
    });
    mockPrismaClient.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      role: "READER",
      emailVerified: true,
      createdAt: new Date(),
      journalistProfile: null,
      subscription: null,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe("user-1");
    expect(body.data.email).toBe("test@example.com");
  });

  it("returns 404 when user not found in DB", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "nonexistent" },
      sessionId: "sess-1",
    });
    mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(404);
  });
});
