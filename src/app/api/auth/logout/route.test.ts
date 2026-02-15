import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockDestroySession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockDestroySession: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getSession: mockGetSession,
    destroySession: mockDestroySession,
  };
});

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDestroySession.mockResolvedValue(undefined);
  });

  it("logs out an authenticated user", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1" },
      sessionId: "sess-1",
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe("Logged out");
    expect(mockDestroySession).toHaveBeenCalled();
  });

  it("succeeds even without an active session", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe("Logged out");
  });
});
