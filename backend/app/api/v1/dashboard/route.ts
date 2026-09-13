import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getUserRuns } from "@/modules/runs";
import { getContributionYear } from "@/modules/contributions";
import { calculateStreaks } from "@/modules/streaks";
import { getUserStats } from "@/modules/statistics";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";

// GET /api/v1/dashboard - Get dashboard data
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    // Verify Auth0 token
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Get current year for contribution data
    const currentYear = new Date().getFullYear();

    // Fetch all data in parallel
    const [stats, streaks, recentRunsResult, contributions] = await Promise.all([
      getUserStats(user.id),
      calculateStreaks(user.id),
      getUserRuns(user.id, { page: 1, limit: 1, sort: "desc" }),
      getContributionYear(user.id, currentYear),
    ]);

    // Get recent run
    const recentRun = recentRunsResult.runs[0] || null;

    // Get weekly stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Get contribution preview (last 7 days)
    const today = new Date();
    const contributionPreview = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = contributions.days.find((d) => d.date === dateStr);
      contributionPreview.push(dayData || { date: dateStr, runCount: 0, distanceMeters: 0, level: 0 });
    }

    logger.info({ userId: user.id }, "Dashboard fetched");

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        streak: {
          current: streaks.currentStreak,
          longest: streaks.longestStreak,
          currentStreakStartDate: streaks.currentStreakStartDate,
          lastActiveDate: streaks.lastActiveDate,
        },
        weekly: {
          distanceMeters: stats.distanceThisWeekMeters,
          durationSeconds: 0, // TODO: Calculate weekly duration
          runCount: stats.runsThisWeek,
        },
        monthly: {
          distanceMeters: stats.distanceThisMonthMeters,
          runCount: 0, // TODO: Calculate monthly run count
        },
        recentRun: recentRun
          ? {
              id: recentRun.id,
              name: recentRun.name,
              title: recentRun.name,
              distanceMeters: recentRun.distanceMeters,
              durationSeconds: recentRun.movingDurationSeconds,
              movingDurationSeconds: recentRun.movingDurationSeconds,
              averagePaceSecondsPerKm: recentRun.averagePaceSecondsPerKm,
              elevationGainMeters: recentRun.elevationGainMeters,
              calories: recentRun.calories,
              startedAt: recentRun.startedAt,
              stravaUrl: recentRun.stravaUrl,
            }
          : null,
        contributionPreview,
        stats: {
          totalRuns: stats.totalRuns,
          totalDistanceMeters: stats.totalDistanceMeters,
          totalDurationSeconds: stats.totalDurationSeconds,
          longestRunMeters: stats.longestRunMeters,
          fastestPaceSecondsPerKm: stats.fastestPaceSecondsPerKm,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch dashboard");
    return handleApiError(error, requestId);
  }
}
