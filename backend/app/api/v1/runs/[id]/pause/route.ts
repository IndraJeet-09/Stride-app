import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { pauseRun } from "@/modules/runs";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// POST /api/v1/runs/:id/pause - Pause a run
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

    // Pause the run
    const run = await pauseRun(user.id, id);

    logger.info({ runId: run.id, userId: user.id }, "Run paused");

    return NextResponse.json({
      data: {
        run: {
          id: run.id,
          status: run.status,
          startedAt: run.startedAt,
          endedAt: run.endedAt,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to pause run");
    return handleApiError(error, requestId);
  }
}
