import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { RedirectError } from "@/test/setup";

const { mockVerifyMagicLink, mockCreateSession, mockSetSessionCookie } = vi.hoisted(() => ({
  mockVerifyMagicLink: vi.fn(),
  mockCreateSession: vi.fn(),
  mockSetSessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    verifyMagicLink: mockVerifyMagicLink,
    createSession: mockCreateSession,
    setSessionCookie: mockSetSessionCookie,
  };
});

import { GET } from "./route";

describe("GET /api/auth/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSession.mockResolvedValue("session-token-abc");
    mockSetSessionCookie.mockResolvedValue(undefined);
  });

  it("redirects to login when token is missing", async () => {
    const request = new NextRequest("http://localhost/api/auth/verify");

    await expect(GET(request)).rejects.toThrow(RedirectError);

    try {
      await GET(request);
    } catch (e) {
      expect((e as RedirectError).url).toContain("error=missing_token");
    }
  });

  it("redirects to login when token is invalid", async () => {
    mockVerifyMagicLink.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/auth/verify?token=invalid-token");

    try {
      await GET(request);
    } catch (e) {
      expect(e).toBeInstanceOf(RedirectError);
      expect((e as RedirectError).url).toContain("error=invalid_token");
    }
  });

  it("creates session and redirects admin to /admin", async () => {
    mockVerifyMagicLink.mockResolvedValue({
      id: "user-admin",
      email: "admin@example.com",
      role: "ADMIN",
    });

    const request = new NextRequest("http://localhost/api/auth/verify?token=valid-token");

    try {
      await GET(request);
    } catch (e) {
      expect(e).toBeInstanceOf(RedirectError);
      expect((e as RedirectError).url).toBe("/admin");
    }

    expect(mockCreateSession).toHaveBeenCalledWith("user-admin", undefined, undefined);
    expect(mockSetSessionCookie).toHaveBeenCalledWith("session-token-abc");
  });

  it("redirects journalist to /journalist/dashboard", async () => {
    mockVerifyMagicLink.mockResolvedValue({
      id: "user-j",
      email: "journalist@example.com",
      role: "JOURNALIST",
    });

    const request = new NextRequest("http://localhost/api/auth/verify?token=valid-token");

    try {
      await GET(request);
    } catch (e) {
      expect(e).toBeInstanceOf(RedirectError);
      expect((e as RedirectError).url).toBe("/journalist/dashboard");
    }
  });

  it("redirects reader to /feed", async () => {
    mockVerifyMagicLink.mockResolvedValue({
      id: "user-r",
      email: "reader@example.com",
      role: "READER",
    });

    const request = new NextRequest("http://localhost/api/auth/verify?token=valid-token");

    try {
      await GET(request);
    } catch (e) {
      expect(e).toBeInstanceOf(RedirectError);
      expect((e as RedirectError).url).toBe("/feed");
    }
  });
});
