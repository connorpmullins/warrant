import { NextRequest } from "next/server";
import { createMagicLink } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api";

const PRODUCTION_HOSTNAME = "warrant.ink";

// DEV/STAGING: Returns raw magic link token for E2E tests and staging login.
// Blocked on production hostname only — available on localhost, dev.warrant.ink, and Vercel preview URLs.
export async function POST(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] || "";
  if (host === PRODUCTION_HOSTNAME || host === `www.${PRODUCTION_HOSTNAME}`) {
    return errorResponse("Not available", 404);
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return errorResponse("Email required", 400);
    }

    const token = await createMagicLink(email);
    return successResponse({ token });
  } catch (error) {
    console.error("Test login error:", error);
    return errorResponse("Failed to create test login", 500);
  }
}
