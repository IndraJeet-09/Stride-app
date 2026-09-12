import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { finishRun } from "@/modules/runs";
import { calculateAndUpdateRunMetrics } from "@/modules/metrics";
import { finishRunSchema } from "@/schemas";
import { handleApiError, validationError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// POST /api/v1/runs/:id/finish - Finish a run
export async function POST(
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = finishRunSchema.safeParse(body);

    if (!validationResult.success) {
      throw validationError(validationResult.error.errors[0].message);
    }

    const { endedAt, notes } = validationResult.data;

    // Finish the run
    const run = await finishRun(
      user.id,
      id,
      endedAt ? new Date(endedAt) : undefined
    );

    // Calculate and update metrics
    let metrics = null;
    try {
      metrics = await calculateAndUpdateRunMetrics(id);
    } catch (error) {
      logger.warn({ error, runId: id }, "Failed to calculate metrics, run still finished");
    }

    logger.info({ runId: run.id, userId: user.id, metrics }, "Run finished");

    return NextResponse.json({
      data: {
        run: {
          id: run.id,
          status: run.status,
          startedAt: run.startedAt,
          endedAt: run.endedAt,
          distanceMeters: metrics?.distanceMeters || run.distanceMeters,
          durationSeconds: metrics?.durationSeconds || run.durationSeconds,
          movingDurationSeconds: metrics?.movingDurationSeconds || run.movingDurationSeconds,
          averagePaceSecondsPerKm: metrics?.averagePaceSecondsPerKm || run.averagePaceSecondsPerKm,
          elevationGainMeters: metrics?.elevationGainMeters || run.elevationGainMeters,
          elevationLossMeters: metrics?.elevationLossMeters || run.elevationLossMeters,
          calories: run.calories,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to finish run");
    return handleApiError(error, requestId);
  }
}
