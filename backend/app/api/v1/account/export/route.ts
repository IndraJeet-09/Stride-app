import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/account/export - Export user data
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // TODO: Implement full data export
    // This should include:
    // - Profile data
    // - All runs
    // - GPS tracks
    // - Statistics
    // - Contributions
    // For now, return a placeholder

    logger.info({ userId: user.id }, "Data export requested");

    return NextResponse.json({
      data: {
        message: "Data export is being prepared",
        estimatedTime: "5-10 minutes",
        downloadUrl: null, // Will be populated when export is ready
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to export data");
    return handleApiError(error, requestId);
  }
}
