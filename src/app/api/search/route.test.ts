import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { searchArticles, searchAuthors } from "@/lib/search";

import { GET } from "./route";

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchArticles).mockResolvedValue({ hits: [], totalHits: 0 });
    vi.mocked(searchAuthors).mockResolvedValue({ hits: [], totalHits: 0 });
  });

  it("returns empty results for empty query", async () => {
    const request = new NextRequest("http://localhost/api/search");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.articles).toEqual([]);
    expect(searchArticles).not.toHaveBeenCalled();
  });

  it("searches articles by default", async () => {
    vi.mocked(searchArticles).mockResolvedValueOnce({
      hits: [{ id: "a-1", title: "Test" }],
      totalHits: 1,
    } as never);

    const request = new NextRequest("http://localhost/api/search?q=test");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.articles).toHaveLength(1);
    expect(searchArticles).toHaveBeenCalledWith(
      "test",
      expect.objectContaining({ limit: 20, offset: 0 })
    );
  });

  it("searches authors when type=authors", async () => {
    vi.mocked(searchAuthors).mockResolvedValueOnce({
      hits: [{ id: "j-1", pseudonym: "writer" }],
      totalHits: 1,
    } as never);

    const request = new NextRequest("http://localhost/api/search?q=writer&type=authors");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.authors).toHaveLength(1);
    expect(searchArticles).not.toHaveBeenCalled();
  });

  it("searches both when type=all", async () => {
    vi.mocked(searchArticles).mockResolvedValueOnce({
      hits: [],
      totalHits: 0,
    } as never);
    vi.mocked(searchAuthors).mockResolvedValueOnce({
      hits: [],
      totalHits: 0,
    } as never);

    const request = new NextRequest("http://localhost/api/search?q=test&type=all");
    await GET(request);

    expect(searchArticles).toHaveBeenCalled();
    expect(searchAuthors).toHaveBeenCalled();
  });

  it("caps limit at 50", async () => {
    const request = new NextRequest("http://localhost/api/search?q=test&limit=100");
    await GET(request);

    expect(searchArticles).toHaveBeenCalledWith("test", expect.objectContaining({ limit: 50 }));
  });
});
