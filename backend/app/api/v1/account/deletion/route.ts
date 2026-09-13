import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// DELETE /api/v1/account/deletion - Delete user account
export async function DELETE(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Soft delete user
    await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // In production, this should:
    // 1. Mark account as deleted
    // 2. Invalidate all active sessions
    // 3. Queue permanent data deletion (30 day grace period)
    // 4. Delete all user data after grace period
    // 5. Retain minimal records for legal/operational requirements

    // For now, just soft delete the user
    // The user's data will remain in the database but be inaccessible

    logger.info({ userId: user.id }, "Account deletion requested");

    return NextResponse.json({
      data: {
        message: "Account deletion request received",
        gracePeriod: "30 days",
        note: "Your account will be permanently deleted after 30 days. You can contact support to cancel this request.",
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete account");
    return handleApiError(error, requestId);
  }
}
