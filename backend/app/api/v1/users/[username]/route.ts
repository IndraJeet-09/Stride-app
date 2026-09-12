import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile } from "@/modules/profiles";
import { handleApiError, notFoundError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/users/:username - Get public profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    const { username } = await params;

    // Get public profile
    const profile = await getPublicProfile(username);
    if (!profile) {
      throw notFoundError("User not found");
    }

    logger.info({ username }, "Public profile fetched");

    return NextResponse.json({
      data: profile,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch public profile");
    return handleApiError(error, requestId);
  }
}
