import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { discardRun } from "@/modules/runs";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// POST /api/v1/runs/:id/discard - Discard a run
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

    // Discard the run
    const run = await discardRun(user.id, id);

    logger.info({ runId: run.id, userId: user.id }, "Run discarded");

    return NextResponse.json({
      data: {
        run: {
          id: run.id,
          status: run.status,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to discard run");
    return handleApiError(error, requestId);
  }
}
