import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";

const { mockRequireAuth } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAuth: mockRequireAuth };
});

import { PATCH, POST } from "./route";

const JOURNALIST = {
  id: "user-j",
  email: "journalist@example.com",
  role: "JOURNALIST",
};
const READER = { id: "user-r", email: "reader@example.com", role: "READER" };

describe("PATCH /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(JOURNALIST);
    mockPrismaClient.user.update.mockResolvedValue({});
    mockPrismaClient.journalistProfile.update.mockResolvedValue({});
    mockPrismaClient.journalistProfile.findFirst.mockResolvedValue(null);
  });

  it("updates display name", async () => {
    const request = new NextRequest("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "New Name" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: "user-j" },
      data: { displayName: "New Name" },
    });
  });

  it("updates journalist pseudonym", async () => {
    const request = new NextRequest("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ pseudonym: "new-pen-name" }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockPrismaClient.journalistProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-j" },
        data: expect.objectContaining({ pseudonym: "new-pen-name" }),
      })
    );
  });

  it("rejects duplicate pseudonym", async () => {
    mockPrismaClient.journalistProfile.findFirst.mockResolvedValueOnce({
      id: "other-profile",
    });

    const request = new NextRequest("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ pseudonym: "taken-name" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already taken");
  });

  it("does not update journalist fields for non-journalist", async () => {
    mockRequireAuth.mockResolvedValue(READER);

    const request = new NextRequest("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "Reader Name",
        pseudonym: "attempt",
      }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockPrismaClient.journalistProfile.update).not.toHaveBeenCalled();
  });

  it("rejects invalid display name (too short)", async () => {
    const request = new NextRequest("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName: "A" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/profile (apply journalist)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(READER);
    mockPrismaClient.journalistProfile.findFirst.mockResolvedValue(null);
    mockPrismaClient.$transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === "function") return fn(mockPrismaClient);
      return fn;
    });
    mockPrismaClient.user.update.mockResolvedValue({});
    mockPrismaClient.journalistProfile.create.mockResolvedValue({});
  });

  it("creates journalist profile for a reader", async () => {
    const request = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({
        pseudonym: "new-journalist",
        bio: "I report on tech",
        beats: ["technology"],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toContain("Application submitted");
  });

  it("rejects if already a journalist", async () => {
    mockRequireAuth.mockResolvedValue(JOURNALIST);

    const request = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({
        pseudonym: "another-name",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already a journalist");
  });

  it("rejects duplicate pseudonym on application", async () => {
    mockPrismaClient.journalistProfile.findFirst.mockResolvedValueOnce({
      id: "existing",
    });

    const request = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({
        pseudonym: "taken-name",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already taken");
  });

  it("rejects invalid pseudonym format", async () => {
    const request = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({
        pseudonym: "has spaces!",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
