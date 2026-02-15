import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";

const {
  mockRequireAuth,
  mockAssessSourceCompleteness,
  mockAssessContentRisk,
  mockRecordReputationEvent,
  mockApplyLabel,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockAssessSourceCompleteness: vi.fn(),
  mockAssessContentRisk: vi.fn(),
  mockRecordReputationEvent: vi.fn(),
  mockApplyLabel: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAuth: mockRequireAuth };
});

vi.mock("@/services/integrity", () => ({
  assessSourceCompleteness: (...args: unknown[]) => mockAssessSourceCompleteness(...args),
  assessContentRisk: (...args: unknown[]) => mockAssessContentRisk(...args),
  recordReputationEvent: (...args: unknown[]) => mockRecordReputationEvent(...args),
  applyLabel: (...args: unknown[]) => mockApplyLabel(...args),
}));

import { POST } from "./route";

const TEST_USER = { id: "user-1", email: "journalist@example.com", role: "JOURNALIST" };
const TEST_ARTICLE = {
  id: "article-1",
  slug: "test-article",
  title: "Test Article",
  contentText: "Some article content for testing purposes",
  authorId: "user-1",
  status: "DRAFT",
  sources: [{ sourceType: "PRIMARY", quality: "NAMED", url: "https://example.com" }],
  author: {
    journalistProfile: { pseudonym: "testwriter", reputationScore: 80 },
  },
};

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/articles/${id}/publish`, {
    method: "POST",
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/articles/[id]/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue(TEST_USER);
    mockAssessSourceCompleteness.mockReturnValue({
      complete: true,
      score: 0.9,
      issues: [],
    });
    mockAssessContentRisk.mockReturnValue({
      riskLevel: "LOW",
      shouldHold: false,
      triggers: [],
    });
    mockRecordReputationEvent.mockResolvedValue(undefined);
    mockApplyLabel.mockResolvedValue(undefined);
    mockPrismaClient.article.update.mockResolvedValue(TEST_ARTICLE);
    mockPrismaClient.journalistProfile.updateMany.mockResolvedValue({ count: 1 });
  });

  it("publishes a draft article with complete sources", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("PUBLISHED");
    expect(body.data.sourceAssessment.complete).toBe(true);
    expect(mockPrismaClient.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "article-1" },
        data: expect.objectContaining({ status: "PUBLISHED" }),
      })
    );
    expect(mockRecordReputationEvent).toHaveBeenCalledWith("user-1", "ARTICLE_PUBLISHED", {
      articleId: "article-1",
    });
  });

  it("returns 404 for non-existent article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(null);

    const response = await POST(makeRequest("missing"), makeParams("missing"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it("returns 403 if user is not the author", async () => {
    mockRequireAuth.mockResolvedValue({
      id: "other-user",
      email: "other@example.com",
      role: "JOURNALIST",
    });
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it("allows admin to publish any article", async () => {
    mockRequireAuth.mockResolvedValue({ id: "admin-1", email: "admin@example.com", role: "ADMIN" });
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("rejects already published article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      ...TEST_ARTICLE,
      status: "PUBLISHED",
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already published");
  });

  it("rejects removed article", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce({
      ...TEST_ARTICLE,
      status: "REMOVED",
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Removed articles");
  });

  it("holds high-risk articles for review", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);
    mockAssessContentRisk.mockReturnValue({
      riskLevel: "HIGH",
      shouldHold: true,
      triggers: ["inflammatory_language"],
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("HELD");
    expect(mockPrismaClient.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "HELD" }),
      })
    );
    expect(mockApplyLabel).toHaveBeenCalledWith(
      "article-1",
      "UNDER_REVIEW",
      "user-1",
      expect.any(String)
    );
  });

  it("applies NEEDS_SOURCE label when sources incomplete", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);
    mockAssessSourceCompleteness.mockReturnValue({
      complete: false,
      score: 0.3,
      issues: ["No named sources"],
    });

    const response = await POST(makeRequest("article-1"), makeParams("article-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("PUBLISHED");
    expect(body.data.sourceAssessment.complete).toBe(false);
    expect(mockApplyLabel).toHaveBeenCalledWith(
      "article-1",
      "NEEDS_SOURCE",
      "user-1",
      "No named sources"
    );
  });

  it("records SOURCE_COMPLETE reputation event when sources are complete", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);

    await POST(makeRequest("article-1"), makeParams("article-1"));

    expect(mockRecordReputationEvent).toHaveBeenCalledWith("user-1", "SOURCE_COMPLETE", {
      articleId: "article-1",
    });
  });

  it("increments journalist article count", async () => {
    mockPrismaClient.article.findUnique.mockResolvedValueOnce(TEST_ARTICLE);

    await POST(makeRequest("article-1"), makeParams("article-1"));

    expect(mockPrismaClient.journalistProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { articleCount: { increment: 1 } },
    });
  });
});
