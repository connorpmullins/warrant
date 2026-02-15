import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetFeed = vi.fn();
const mockGetChronologicalFeed = vi.fn();
vi.mock("@/services/distribution", () => ({
  getFeed: (...args: unknown[]) => mockGetFeed(...args),
  getChronologicalFeed: (...args: unknown[]) => mockGetChronologicalFeed(...args),
}));

import { GET } from "./route";

const FEED_RESULT = {
  articles: [
    { id: "a-1", title: "Article 1", score: 85 },
    { id: "a-2", title: "Article 2", score: 70 },
  ],
  total: 42,
};

describe("GET /api/feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFeed.mockResolvedValue(FEED_RESULT);
    mockGetChronologicalFeed.mockResolvedValue(FEED_RESULT);
  });

  it("returns ranked feed with defaults", async () => {
    const request = new NextRequest("http://localhost/api/feed");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.articles).toHaveLength(2);
    expect(body.data.pagination.page).toBe(1);
    expect(body.data.pagination.limit).toBe(20);
    expect(body.data.pagination.total).toBe(42);
    expect(body.data.sort).toBe("ranked");

    expect(mockGetFeed).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      authorId: undefined,
    });
  });

  it("supports pagination", async () => {
    const request = new NextRequest("http://localhost/api/feed?page=3&limit=10");
    await GET(request);

    expect(mockGetFeed).toHaveBeenCalledWith({
      limit: 10,
      offset: 20,
      authorId: undefined,
    });
  });

  it("caps limit at 50", async () => {
    const request = new NextRequest("http://localhost/api/feed?limit=100");
    await GET(request);

    expect(mockGetFeed).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
  });

  it("returns chronological feed when sort=chronological", async () => {
    const request = new NextRequest("http://localhost/api/feed?sort=chronological");
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.sort).toBe("chronological");
    expect(mockGetChronologicalFeed).toHaveBeenCalled();
    expect(mockGetFeed).not.toHaveBeenCalled();
  });

  it("filters by authorId", async () => {
    const request = new NextRequest("http://localhost/api/feed?authorId=user-123");
    await GET(request);

    expect(mockGetFeed).toHaveBeenCalledWith(expect.objectContaining({ authorId: "user-123" }));
  });

  it("handles service errors gracefully", async () => {
    mockGetFeed.mockRejectedValueOnce(new Error("DB connection failed"));

    const request = new NextRequest("http://localhost/api/feed");
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
