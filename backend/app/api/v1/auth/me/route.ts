import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token and get user
    const authUser = await requireAuth(req);
    
    // Get or create Stride user (idempotent)
    const user = await getOrCreateUser(authUser);

    logger.info({ userId: user.id }, "Auth/me successful");

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          timezone: user.timezone,
          unitSystem: user.unitSystem,
          isPublic: user.isPublic,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Auth/me failed");
    return handleApiError(error, requestId);
  }
}
