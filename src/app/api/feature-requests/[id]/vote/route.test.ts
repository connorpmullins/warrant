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

import { POST } from "./route";

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/feature-requests/${id}/vote`, {
    method: "POST",
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/feature-requests/[id]/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: "user-1", role: "READER" });
  });

  it("returns 404 for non-existent feature request", async () => {
    mockPrismaClient.featureRequest.findUnique.mockResolvedValueOnce(null);

    const response = await POST(makeRequest("missing"), makeParams("missing"));
    expect(response.status).toBe(404);
  });

  it("adds a vote when none exists", async () => {
    mockPrismaClient.featureRequest.findUnique.mockResolvedValueOnce({ id: "fr-1" });
    mockPrismaClient.vote.findUnique.mockResolvedValueOnce(null);
    mockPrismaClient.vote.create.mockResolvedValueOnce({});

    const response = await POST(makeRequest("fr-1"), makeParams("fr-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.voted).toBe(true);
  });

  it("removes an existing vote (toggle off)", async () => {
    mockPrismaClient.featureRequest.findUnique.mockResolvedValueOnce({ id: "fr-1" });
    mockPrismaClient.vote.findUnique.mockResolvedValueOnce({ id: "vote-1" });
    mockPrismaClient.vote.delete.mockResolvedValueOnce({});

    const response = await POST(makeRequest("fr-1"), makeParams("fr-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.voted).toBe(false);
  });
});
