import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { mockPrismaClient } from "@/test/setup";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getSession: vi.fn().mockResolvedValue(null),
    requireJournalist: vi.fn(),
  };
});

describe("GET /api/articles author lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves non-UUID authorId as pseudonym", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce({
      userId: "user-1",
    });
    mockPrismaClient.article.findMany.mockResolvedValueOnce([]);
    mockPrismaClient.article.count.mockResolvedValueOnce(0);

    const request = new NextRequest(
      "http://localhost/api/articles?authorId=E.Vasquez&status=PUBLISHED"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.articles).toEqual([]);
    expect(mockPrismaClient.journalistProfile.findUnique).toHaveBeenCalledWith({
      where: { pseudonym: "E.Vasquez" },
      select: { userId: true },
    });
  });

  it("returns empty result when pseudonym does not exist", async () => {
    mockPrismaClient.journalistProfile.findUnique.mockResolvedValueOnce(null);

    const request = new NextRequest(
      "http://localhost/api/articles?authorId=Unknown.Author&status=PUBLISHED"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.articles).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
    expect(mockPrismaClient.article.findMany).not.toHaveBeenCalled();
  });
});
