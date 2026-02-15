import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrismaClient } from "@/test/setup";
import { constructWebhookEvent } from "@/lib/stripe";

import { POST } from "./route";

function makeRequest(body: string, signature = "sig_valid") {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: { "stripe-signature": signature },
  });
}

function makeEvent(type: string, data: Record<string, unknown>) {
  return { type, data: { object: data } };
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when signature is missing", async () => {
    const request = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Missing signature");
  });

  it("returns 400 when signature is invalid", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(null as never);

    const response = await POST(makeRequest("{}"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid signature");
  });

  it("handles checkout.session.completed", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("checkout.session.completed", {
        customer: "cus_123",
        subscription: "sub_123",
      }) as never
    );
    mockPrismaClient.subscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(makeRequest("{}"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: "cus_123" },
        data: expect.objectContaining({
          stripeSubscriptionId: "sub_123",
          status: "ACTIVE",
        }),
      })
    );
  });

  it("handles customer.subscription.updated with active status", async () => {
    const now = Math.floor(Date.now() / 1000);
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("customer.subscription.updated", {
        id: "sub_123",
        status: "active",
        current_period_start: now,
        current_period_end: now + 30 * 86400,
      }) as never
    );
    mockPrismaClient.subscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_123" },
        data: expect.objectContaining({ status: "ACTIVE" }),
      })
    );
  });

  it("handles customer.subscription.updated with past_due status", async () => {
    const now = Math.floor(Date.now() / 1000);
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("customer.subscription.updated", {
        id: "sub_456",
        status: "past_due",
        current_period_start: now,
        current_period_end: now + 30 * 86400,
      }) as never
    );
    mockPrismaClient.subscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAST_DUE" }),
      })
    );
  });

  it("handles customer.subscription.deleted", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("customer.subscription.deleted", { id: "sub_del" }) as never
    );
    mockPrismaClient.subscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_del" },
      data: { status: "CANCELED" },
    });
  });

  it("handles identity.verification_session.verified", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("identity.verification_session.verified", {
        id: "vs_123",
        status: "verified",
      }) as never
    );
    mockPrismaClient.journalistProfile.findFirst.mockResolvedValueOnce({
      id: "profile-1",
      userId: "user-1",
      stripeVerificationId: "vs_123",
    });
    mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.journalistProfile.update).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { verificationStatus: "VERIFIED" },
    });
  });

  it("handles identity.verification_session.requires_input", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("identity.verification_session.requires_input", {
        id: "vs_fail",
      }) as never
    );
    mockPrismaClient.journalistProfile.findFirst.mockResolvedValueOnce({
      id: "profile-2",
      userId: "user-2",
      stripeVerificationId: "vs_fail",
    });
    mockPrismaClient.journalistProfile.update.mockResolvedValueOnce({});

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.journalistProfile.update).toHaveBeenCalledWith({
      where: { id: "profile-2" },
      data: { verificationStatus: "FAILED" },
    });
  });

  it("handles invoice.paid with period update", async () => {
    const start = Math.floor(Date.now() / 1000);
    const end = start + 30 * 86400;
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("invoice.paid", {
        id: "inv_1",
        subscription: "sub_inv",
        customer: "cus_inv",
        lines: { data: [{ period: { start, end } }] },
      }) as never
    );
    mockPrismaClient.subscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_inv" },
        data: expect.objectContaining({ status: "ACTIVE" }),
      })
    );
  });

  it("handles invoice.payment_failed", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("invoice.payment_failed", {
        id: "inv_fail",
        subscription: "sub_fail",
        customer: "cus_fail",
        attempt_count: 2,
      }) as never
    );
    mockPrismaClient.subscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect(mockPrismaClient.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: "sub_fail" },
      data: { status: "PAST_DUE" },
    });
  });

  it("returns 200 for unhandled event types", async () => {
    vi.mocked(constructWebhookEvent).mockReturnValueOnce(
      makeEvent("some.unknown.event", {}) as never
    );

    const response = await POST(makeRequest("{}"));

    expect(response.status).toBe(200);
    expect((await response.json()).received).toBe(true);
  });
});
