import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getRunById } from "@/modules/runs";
import { notFoundError, handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/runs/:id - Get run detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    const { id } = await params;

    // Get run with ownership check
    const run = await getRunById(user.id, id);
    if (!run) {
      throw notFoundError("Run not found");
    }

    logger.info({ runId: run.id, userId: user.id }, "Run fetched");

    return NextResponse.json({
      data: {
        id: run.id,
        name: run.name,
        title: run.name,
        status: "completed",
        activityType: run.activityType,
        sportType: run.sportType,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        startedAtLocal: run.startedAtLocal,
        timezone: run.timezone,
        distanceMeters: run.distanceMeters,
        durationSeconds: run.movingDurationSeconds,
        movingDurationSeconds: run.movingDurationSeconds,
        elapsedTimeSeconds: run.elapsedTimeSeconds,
        averagePaceSecondsPerKm: run.averagePaceSecondsPerKm,
        averageSpeedMps: run.averageSpeedMps,
        maxSpeedMps: run.maxSpeedMps,
        elevationGainMeters: run.elevationGainMeters,
        calories: run.calories,
        averageHeartrate: run.averageHeartrate,
        maxHeartrate: run.maxHeartrate,
        trainer: run.trainer,
        commute: run.commute,
        stravaUrl: run.stravaUrl,
        visibility: run.visibility,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch run");
    return handleApiError(error, requestId);
  }
}
