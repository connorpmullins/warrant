import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, getSession: mockGetSession };
});

import { POST } from "./route";

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/articles/${id}/read`, {
    method: "POST",
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/articles/[id]/read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: "user-1" },
      sessionId: "sess-1",
    });
    mockPrismaClient.auditLog.findFirst.mockResolvedValue(null);
    mockPrismaClient.auditLog.create.mockResolvedValue({});
  });

  it("tracks a read for a published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "PUBLISHED",
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.tracked).toBe(true);
    expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
  });

  it("returns 404 for non-published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "DRAFT",
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    expect(response.status).toBe(404);
  });

  it("deduplicates reads for the same user on the same day", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "PUBLISHED",
    });
    mockPrismaClient.auditLog.findFirst.mockResolvedValueOnce({ id: "existing" });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.tracked).toBe(true);
    expect(mockPrismaClient.auditLog.create).not.toHaveBeenCalled();
  });

  it("handles anonymous reads (no session)", async () => {
    mockGetSession.mockResolvedValueOnce(null);
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      id: "article-1",
      status: "PUBLISHED",
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: undefined,
        }),
      })
    );
  });
});
