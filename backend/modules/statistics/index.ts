import { db } from "@/db";
import { runs, dailyActivities } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { calculateStreaks } from "@/modules/streaks";

export interface UserStats {
  totalRuns: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averageDistanceMeters: number;
  averagePaceSecondsPerKm: number;
  longestRunMeters: number;
  fastestPaceSecondsPerKm: number;
  currentStreak: number;
  longestStreak: number;
  runsThisWeek: number;
  distanceThisWeekMeters: number;
  distanceThisMonthMeters: number;
  distanceThisYearMeters: number;
}

export interface PersonalRecords {
  fastest1k: number | null;
  fastest5k: number | null;
  fastest10k: number | null;
  longestRunMeters: number | null;
  highestElevationMeters: number | null;
}

// Get user statistics
export async function getUserStats(userId: string): Promise<UserStats> {
  // Get all completed runs
  const completedRuns = await db.query.runs.findMany({
    where: and(eq(runs.userId, userId), eq(runs.status, "completed")),
  });

  // Calculate basic stats
  const totalRuns = completedRuns.length;
  const totalDistanceMeters = completedRuns.reduce(
    (sum, run) => sum + (run.distanceMeters || 0),
    0
  );
  const totalDurationSeconds = completedRuns.reduce(
    (sum, run) => sum + (run.movingDurationSeconds || 0),
    0
  );
  const averageDistanceMeters = totalRuns > 0 ? totalDistanceMeters / totalRuns : 0;
  const averagePaceSecondsPerKm =
    totalDistanceMeters > 0
      ? Math.floor((totalDurationSeconds / totalDistanceMeters) * 1000)
      : 0;
  const longestRunMeters = Math.max(
    ...completedRuns.map((run) => run.distanceMeters || 0),
    0
  );
  const fastestPaceSecondsPerKm = Math.min(
    ...completedRuns
      .filter((run) => (run.averagePaceSecondsPerKm || 0) > 0)
      .map((run) => run.averagePaceSecondsPerKm || Infinity),
    Infinity
  );

  // Get streaks
  const streaks = await calculateStreaks(userId);

  // Calculate weekly stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekRuns = completedRuns.filter(
    (run) => run.startedAt && run.startedAt >= weekStart
  );
  const runsThisWeek = weekRuns.length;
  const distanceThisWeekMeters = weekRuns.reduce(
    (sum, run) => sum + (run.distanceMeters || 0),
    0
  );

  // Calculate monthly stats
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRuns = completedRuns.filter(
    (run) => run.startedAt && run.startedAt >= monthStart
  );
  const distanceThisMonthMeters = monthRuns.reduce(
    (sum, run) => sum + (run.distanceMeters || 0),
    0
  );

  // Calculate yearly stats
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearRuns = completedRuns.filter(
    (run) => run.startedAt && run.startedAt >= yearStart
  );
  const distanceThisYearMeters = yearRuns.reduce(
    (sum, run) => sum + (run.distanceMeters || 0),
    0
  );

  return {
    totalRuns,
    totalDistanceMeters,
    totalDurationSeconds,
    averageDistanceMeters,
    averagePaceSecondsPerKm:
      fastestPaceSecondsPerKm === Infinity ? 0 : fastestPaceSecondsPerKm,
    longestRunMeters,
    fastestPaceSecondsPerKm:
      fastestPaceSecondsPerKm === Infinity ? 0 : fastestPaceSecondsPerKm,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    runsThisWeek,
    distanceThisWeekMeters,
    distanceThisMonthMeters,
    distanceThisYearMeters,
  };
}

// Get personal records
export async function getPersonalRecords(userId: string): Promise<PersonalRecords> {
  const completedRuns = await db.query.runs.findMany({
    where: and(eq(runs.userId, userId), eq(runs.status, "completed")),
  });

  // Calculate 1km pace (find best km split)
  let fastest1k: number | null = null;
  let fastest5k: number | null = null;
  let fastest10k: number | null = null;

  for (const run of completedRuns) {
    // Simple approximation based on distance and pace
    const distanceKm = (run.distanceMeters || 0) / 1000;
    const pace = run.averagePaceSecondsPerKm || 0;

    if (pace > 0) {
      if (distanceKm >= 1 && (fastest1k === null || pace < fastest1k)) {
        fastest1k = pace;
      }
      if (distanceKm >= 5 && (fastest5k === null || pace < fastest5k)) {
        fastest5k = pace;
      }
      if (distanceKm >= 10 && (fastest10k === null || pace < fastest10k)) {
        fastest10k = pace;
      }
    }
  }

  const longestRunMeters = Math.max(
    ...completedRuns.map((run) => run.distanceMeters || 0),
    0
  );

  const highestElevationMeters = Math.max(
    ...completedRuns.map((run) => run.elevationGainMeters || 0),
    0
  );

  return {
    fastest1k,
    fastest5k,
    fastest10k,
    longestRunMeters: longestRunMeters || null,
    highestElevationMeters: highestElevationMeters || null,
  };
}
