import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getConnectionInfo, disconnectStrava } from "@/modules/strava/connection";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

/**
 * GET /api/v1/integrations/strava
 * Returns safe Strava connection information (no tokens).
 */
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    const connectionInfo = await getConnectionInfo(user.id);

    logger.info({ userId: user.id, connected: connectionInfo.connected }, "Strava connection status fetched");

    return NextResponse.json({
      data: connectionInfo,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch Strava connection status");
    return handleApiError(error, requestId);
  }
}

/**
 * DELETE /api/v1/integrations/strava
 * Disconnects the user's Strava connection.
 */
export async function DELETE(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    await disconnectStrava(user.id);

    logger.info({ userId: user.id }, "Strava disconnected");

    return NextResponse.json({
      data: {
        disconnected: true,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to disconnect Strava");
    return handleApiError(error, requestId);
  }
}
