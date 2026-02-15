import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";

const { mockRequireAuth, mockGetSession } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGetSession: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAuth: mockRequireAuth, getSession: mockGetSession };
});

import { GET, POST } from "./route";

describe("GET /api/feature-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockPrismaClient.featureRequest.findMany.mockResolvedValue([]);
    mockPrismaClient.featureRequest.count.mockResolvedValue(0);
  });

  it("returns paginated feature requests", async () => {
    mockPrismaClient.featureRequest.findMany.mockResolvedValueOnce([
      {
        id: "fr-1",
        title: "Dark mode",
        description: "Please add dark mode",
        status: "OPEN",
        decisionLog: null,
        createdAt: new Date(),
        user: { displayName: "Reader" },
        _count: { votes: 5 },
        votes: [],
      },
    ]);
    mockPrismaClient.featureRequest.count.mockResolvedValueOnce(1);

    const request = new NextRequest("http://localhost/api/feature-requests");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.requests).toHaveLength(1);
    expect(body.data.requests[0].voteCount).toBe(5);
    expect(body.data.pagination.total).toBe(1);
  });
});

describe("POST /api/feature-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: "user-1", role: "READER" });
  });

  it("creates a feature request", async () => {
    mockPrismaClient.featureRequest.create.mockResolvedValueOnce({
      id: "fr-new",
    });

    const request = new NextRequest("http://localhost/api/feature-requests", {
      method: "POST",
      body: JSON.stringify({
        title: "Dark mode support",
        description: "It would be great to have a dark theme",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.featureRequest.id).toBe("fr-new");
  });

  it("rejects invalid input (missing title)", async () => {
    const request = new NextRequest("http://localhost/api/feature-requests", {
      method: "POST",
      body: JSON.stringify({ description: "No title" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
