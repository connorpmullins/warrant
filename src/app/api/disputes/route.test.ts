import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";

const { mockRequireAuth, mockApplyLabel } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockApplyLabel: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAuth: mockRequireAuth };
});

vi.mock("@/services/integrity", () => ({
  applyLabel: (...args: unknown[]) => mockApplyLabel(...args),
}));

import { POST, GET } from "./route";

const READER = { id: "user-1", email: "reader@example.com", role: "READER" };
const ADMIN = { id: "admin-1", email: "admin@example.com", role: "ADMIN" };
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("POST /api/disputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(READER);
    mockApplyLabel.mockResolvedValue(undefined);
  });

  it("creates a dispute for a published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: VALID_UUID,
      status: "PUBLISHED",
      authorId: "other-user",
    });
    mockPrismaClient.dispute.findFirst.mockResolvedValueOnce(null);
    mockPrismaClient.dispute.create.mockResolvedValueOnce({ id: "dispute-1" });

    const request = new NextRequest("http://localhost/api/disputes", {
      method: "POST",
      body: JSON.stringify({
        articleId: VALID_UUID,
        reason: "This article contains verifiably false claims about the data.",
        evidence: "See original dataset at https://example.com/data",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.dispute.id).toBe("dispute-1");
    expect(mockApplyLabel).toHaveBeenCalledWith(
      VALID_UUID,
      "DISPUTED",
      "user-1",
      expect.any(String)
    );
  });

  it("rejects dispute on non-published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: VALID_UUID,
      status: "DRAFT",
      authorId: "other-user",
    });

    const request = new NextRequest("http://localhost/api/disputes", {
      method: "POST",
      body: JSON.stringify({
        articleId: VALID_UUID,
        reason: "This is a dispute reason that is long enough.",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("prevents authors from disputing their own articles", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: VALID_UUID,
      status: "PUBLISHED",
      authorId: "user-1",
    });

    const request = new NextRequest("http://localhost/api/disputes", {
      method: "POST",
      body: JSON.stringify({
        articleId: VALID_UUID,
        reason: "I dispute my own article for some reason here.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("cannot dispute your own");
  });

  it("rejects duplicate active dispute", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: VALID_UUID,
      status: "PUBLISHED",
      authorId: "other-user",
    });
    mockPrismaClient.dispute.findFirst.mockResolvedValueOnce({
      id: "existing-dispute",
    });

    const request = new NextRequest("http://localhost/api/disputes", {
      method: "POST",
      body: JSON.stringify({
        articleId: VALID_UUID,
        reason: "Another dispute attempt on the same article.",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already have an active dispute");
  });

  it("rejects invalid input (reason too short)", async () => {
    const request = new NextRequest("http://localhost/api/disputes", {
      method: "POST",
      body: JSON.stringify({
        articleId: VALID_UUID,
        reason: "Too short",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("GET /api/disputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns disputes for admin (all disputes)", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrismaClient.dispute.findMany.mockResolvedValueOnce([
      {
        id: "d-1",
        article: { title: "Test", slug: "test" },
        submitter: { displayName: "Reader" },
        reviewer: null,
      },
    ]);

    const request = new NextRequest("http://localhost/api/disputes");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.disputes).toHaveLength(1);
  });

  it("filters by articleId when provided", async () => {
    mockRequireAuth.mockResolvedValue(ADMIN);
    mockPrismaClient.dispute.findMany.mockResolvedValueOnce([]);

    const request = new NextRequest(`http://localhost/api/disputes?articleId=${VALID_UUID}`);
    await GET(request);

    expect(mockPrismaClient.dispute.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ articleId: VALID_UUID }),
      })
    );
  });

  it("restricts non-admin to own disputes or disputes on own articles", async () => {
    mockRequireAuth.mockResolvedValue(READER);
    mockPrismaClient.dispute.findMany.mockResolvedValueOnce([]);

    const request = new NextRequest("http://localhost/api/disputes");
    await GET(request);

    expect(mockPrismaClient.dispute.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { submitterId: "user-1" },
            { article: { authorId: "user-1" } },
          ]),
        }),
      })
    );
  });
});
