import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyJournalistSchema, updateProfileSchema } from "@/lib/validations";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Update user display name
    if (data.displayName) {
      await db.user.update({
        where: { id: user.id },
        data: { displayName: data.displayName },
      });
    }

    // Update journalist profile fields
    if (user.role === "JOURNALIST") {
      const profileData: Record<string, unknown> = {};
      if (data.pseudonym) {
        // Check pseudonym uniqueness
        const existing = await db.journalistProfile.findFirst({
          where: { pseudonym: data.pseudonym, userId: { not: user.id } },
        });
        if (existing) {
          return errorResponse("Pseudonym is already taken", 400);
        }
        profileData.pseudonym = data.pseudonym;
      }
      if (data.bio !== undefined) profileData.bio = data.bio;
      if (data.beats) profileData.beats = data.beats;

      if (Object.keys(profileData).length > 0) {
        await db.journalistProfile.update({
          where: { userId: user.id },
          data: profileData,
        });
      }
    }

    await auditLog({
      userId: user.id,
      action: "profile_updated",
      entity: "User",
      entityId: user.id,
    });

    return successResponse({ message: "Profile updated" });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/profile/apply-journalist - Apply to become a journalist
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if already a journalist
    if (user.role === "JOURNALIST") {
      return errorResponse("You are already a journalist", 400);
    }

    const body = await request.json();
    const data = applyJournalistSchema.parse(body);

    // Check pseudonym uniqueness
    const existing = await db.journalistProfile.findFirst({
      where: { pseudonym: data.pseudonym },
    });
    if (existing) {
      return errorResponse("Pseudonym is already taken", 400);
    }

    // Create journalist profile and update role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma interactive transaction client type is not exported
    await db.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "JOURNALIST" },
      });

      await tx.journalistProfile.create({
        data: {
          userId: user.id,
          pseudonym: data.pseudonym,
          bio: data.bio || null,
          beats: data.beats,
          verificationStatus: "PENDING",
        },
      });
    });

    await auditLog({
      userId: user.id,
      action: "journalist_application",
      entity: "JournalistProfile",
      details: { pseudonym: data.pseudonym },
    });

    return successResponse({
      message:
        "Application submitted. Please complete identity verification to start publishing.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
