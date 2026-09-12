import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getUserStats, getPersonalRecords } from "@/modules/statistics";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/stats/overview - Get user statistics
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Fetch stats and personal records in parallel
    const [stats, personalRecords] = await Promise.all([
      getUserStats(user.id),
      getPersonalRecords(user.id),
    ]);

    logger.info({ userId: user.id }, "Stats fetched");

    return NextResponse.json({
      data: {
        overview: {
          totalRuns: stats.totalRuns,
          totalDistanceMeters: stats.totalDistanceMeters,
          totalDurationSeconds: stats.totalDurationSeconds,
          averageDistanceMeters: stats.averageDistanceMeters,
          averagePaceSecondsPerKm: stats.averagePaceSecondsPerKm,
          longestRunMeters: stats.longestRunMeters,
          fastestPaceSecondsPerKm: stats.fastestPaceSecondsPerKm,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          runsThisWeek: stats.runsThisWeek,
          distanceThisWeekMeters: stats.distanceThisWeekMeters,
          distanceThisMonthMeters: stats.distanceThisMonthMeters,
          distanceThisYearMeters: stats.distanceThisYearMeters,
        },
        personalRecords,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch stats");
    return handleApiError(error, requestId);
  }
}
