import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeEnabled, retrieveCheckoutSession } from "@/lib/stripe";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";

// GET /api/subscribe/session?session_id=cs_... - Retrieve checkout session details
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isStripeEnabled()) {
      return errorResponse("Billing is temporarily unavailable", 503);
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return errorResponse("Missing session_id parameter", 400);
    }

    const session = await retrieveCheckoutSession(sessionId);
    if (!session) {
      return errorResponse("Failed to retrieve session", 500);
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: { stripeCustomerId: true },
    });

    if (!subscription?.stripeCustomerId) {
      return errorResponse("No billing account found", 404);
    }

    if (session.customerId !== subscription.stripeCustomerId) {
      return errorResponse("Session not found", 404);
    }

    return successResponse(session);
  } catch (error) {
    return handleApiError(error);
  }
}
