import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getUserRuns } from "@/modules/runs";
import { runQuerySchema } from "@/schemas";
import { handleApiError, validationError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/runs - List user's runs
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    const validationResult = runQuerySchema.safeParse(query);

    if (!validationResult.success) {
      throw validationError(validationResult.error.errors[0].message);
    }

    const { page, limit, from, to, sort } = validationResult.data;

    // Get runs
    const result = await getUserRuns(user.id, {
      page,
      limit,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      sort,
    });

    const totalPages = Math.ceil(result.total / limit);

    logger.info({ userId: user.id, count: result.runs.length }, "Runs fetched");

    return NextResponse.json({
      data: result.runs.map((run) => ({
        id: run.id,
        title: run.title,
        status: run.status,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        distanceMeters: run.distanceMeters,
        durationSeconds: run.durationSeconds,
        averagePaceSecondsPerKm: run.averagePaceSecondsPerKm,
        elevationGainMeters: run.elevationGainMeters,
        calories: run.calories,
        visibility: run.visibility,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch runs");
    return handleApiError(error, requestId);
  }
}
