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
        title: run.title,
        status: run.status,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        timezone: run.timezone,
        distanceMeters: run.distanceMeters,
        durationSeconds: run.durationSeconds,
        movingDurationSeconds: run.movingDurationSeconds,
        averagePaceSecondsPerKm: run.averagePaceSecondsPerKm,
        averageSpeedMps: run.averageSpeedMps,
        maxSpeedMps: run.maxSpeedMps,
        elevationGainMeters: run.elevationGainMeters,
        elevationLossMeters: run.elevationLossMeters,
        calories: run.calories,
        startLatitude: run.startLatitude,
        startLongitude: run.startLongitude,
        endLatitude: run.endLatitude,
        endLongitude: run.endLongitude,
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
