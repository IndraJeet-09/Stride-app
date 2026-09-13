import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getStravaConnection } from "@/modules/strava/connection";
import { syncActivities } from "@/modules/strava/sync";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";
import { db } from "@/db";
import { stravaConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/v1/integrations/strava/sync
 * Triggers an incremental sync of Strava activities.
 * Uses atomic status update to prevent concurrent syncs.
 */
export async function POST(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Check for active connection
    const connection = await getStravaConnection(user.id);
    if (!connection) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No Strava connection found. Please connect Strava first.",
          },
        },
        { status: 404 }
      );
    }

    // Atomically set status to syncing (only if not already syncing)
    // This prevents concurrent syncs via a conditional update
    const updateResult = await db
      .update(stravaConnections)
      .set({
        syncStatus: "syncing",
        lastSyncStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(stravaConnections.id, connection.id),
          eq(stravaConnections.syncStatus, "idle")
        )
      )
      .returning({ id: stravaConnections.id });

    // If no rows were updated, sync is already in progress
    if (updateResult.length === 0) {
      return NextResponse.json({
        data: {
          status: "already_syncing",
          message: "Sync is already in progress",
        },
      });
    }

    // Trigger sync in background
    // We return immediately and let the user poll for status
    syncActivities(user.id, { incremental: true }).catch((error) => {
      logger.error({ error }, "Background Strava sync failed");
    });

    logger.info({ userId: user.id }, "Strava sync triggered");

    return NextResponse.json({
      data: {
        status: "syncing",
        message: "Sync started",
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to trigger Strava sync");
    return handleApiError(error, requestId);
  }
}
