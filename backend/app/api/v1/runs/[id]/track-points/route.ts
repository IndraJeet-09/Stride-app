import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getRunById } from "@/modules/runs";
import { ingestTrackPoints } from "@/modules/gps";
import { batchTrackPointsSchema } from "@/schemas";
import { handleApiError, runNotFoundError, validationError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// POST /api/v1/runs/:id/track-points - Ingest GPS track points
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

    // Check if run exists and user owns it
    const run = await getRunById(user.id, id);
    if (!run) {
      throw runNotFoundError();
    }

    // Only accept track points for active or paused runs
    if (run.status !== "recording" && run.status !== "paused") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_RUN_STATE",
            message: "Can only add track points to active or paused runs",
          },
        },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = batchTrackPointsSchema.safeParse(body);

    if (!validationResult.success) {
      throw validationError(validationResult.error.errors[0].message);
    }

    const { points } = validationResult.data;

    // Ingest track points
    const result = await ingestTrackPoints(id, points);

    logger.info(
      {
        runId: id,
        userId: user.id,
        acceptedCount: result.acceptedCount,
        rejectedCount: result.rejectedCount,
      },
      "Track points ingested"
    );

    return NextResponse.json({
      data: {
        acceptedCount: result.acceptedCount,
        totalBatch: points.length,
        lastSequence: result.lastSequence,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to ingest track points");
    return handleApiError(error, requestId);
  }
}
