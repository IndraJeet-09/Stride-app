import { db } from "@/db";
import { runs, runSplits, dailyActivities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  calculateMetricsFromGps,
  generateSplits,
  type GpsPoint,
} from "@/lib/geo";
import { getTrackPoints, calculatePausedDuration } from "@/modules/gps";

export interface RunMetrics {
  distanceMeters: number;
  durationSeconds: number;
  movingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  averageSpeedMps: number;
  maxSpeedMps: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
}

// Calculate and update run metrics
export async function calculateAndUpdateRunMetrics(runId: string): Promise<RunMetrics> {
  // Get the run
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
  });

  if (!run || !run.startedAt || !run.endedAt) {
    throw new Error("Run not found or incomplete");
  }

  // Get track points
  const trackPoints = await getTrackPoints(runId);

  // Get paused duration
  const pausedDuration = await calculatePausedDuration(runId);

  // Calculate metrics from GPS
  const metrics = calculateMetricsFromGps(
    trackPoints,
    run.startedAt,
    run.endedAt,
    pausedDuration
  );

  // Generate splits
  const splits = generateSplits(trackPoints, metrics.distanceMeters);

  // Update run with calculated metrics
  await db
    .update(runs)
    .set({
      distanceMeters: metrics.distanceMeters,
      durationSeconds: metrics.durationSeconds,
      movingDurationSeconds: metrics.movingDurationSeconds,
      averagePaceSecondsPerKm: metrics.averagePaceSecondsPerKm,
      averageSpeedMps: metrics.averageSpeedMps,
      maxSpeedMps: metrics.maxSpeedMps,
      elevationGainMeters: metrics.elevationGainMeters,
      elevationLossMeters: metrics.elevationLossMeters,
      // Set start coordinates from first point
      startLatitude: trackPoints.length > 0 ? trackPoints[0].latitude : null,
      startLongitude: trackPoints.length > 0 ? trackPoints[0].longitude : null,
      // Set end coordinates from last point
      endLatitude: trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].latitude : null,
      endLongitude: trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].longitude : null,
      // Calculate calories (rough estimate: 72 cal per km)
      calories: Math.round((metrics.distanceMeters / 1000) * 72),
      updatedAt: new Date(),
    })
    .where(eq(runs.id, runId));

  // Save splits
  for (const split of splits) {
    await db.insert(runSplits).values({
      id: `split_${nanoid()}`,
      runId,
      splitNumber: split.splitNumber,
      distanceMeters: split.distanceMeters,
      durationSeconds: split.durationSeconds,
      paceSecondsPerKm: split.paceSecondsPerKm,
      elevationGainMeters: split.elevationGainMeters,
    });
  }

  // Update daily activity
  await updateDailyActivity(run.userId, run.startedAt, run.timezone);

  return metrics;
}

// Update daily activity for a run
async function updateDailyActivity(
  userId: string,
  runDate: Date,
  timezone: string
): Promise<void> {
  // Calculate activity date in user's timezone
  // For now, use UTC date - in production, use date-fns-tz
  const activityDate = runDate.toISOString().split("T")[0];

  // Get all completed runs for this user on this date
  const dayStart = new Date(`${activityDate}T00:00:00Z`);
  const dayEnd = new Date(`${activityDate}T23:59:59Z`);

  const dayRuns = await db.query.runs.findMany({
    where: and(
      eq(runs.userId, userId),
      eq(runs.status, "completed"),
      eq(runs.timezone, timezone)
    ),
  });

  // Filter runs that fall on this date in the user's timezone
  // Simple implementation - in production, properly convert timezone
  const filteredRuns = dayRuns.filter((run) => {
    const runDate = run.startedAt.toISOString().split("T")[0];
    return runDate === activityDate;
  });

  // Calculate aggregates
  const runCount = filteredRuns.length;
  const totalDistanceMeters = filteredRuns.reduce(
    (sum, run) => sum + (run.distanceMeters || 0),
    0
  );
  const totalDurationSeconds = filteredRuns.reduce(
    (sum, run) => sum + (run.movingDurationSeconds || 0),
    0
  );

  // Upsert daily activity
  const existingActivity = await db.query.dailyActivities.findFirst({
    where: and(
      eq(dailyActivities.userId, userId),
      eq(dailyActivities.activityDate, activityDate)
    ),
  });

  if (existingActivity) {
    await db
      .update(dailyActivities)
      .set({
        runCount,
        totalDistanceMeters,
        totalDurationSeconds,
        updatedAt: new Date(),
      })
      .where(eq(dailyActivities.id, existingActivity.id));
  } else {
    await db.insert(dailyActivities).values({
      id: `da_${nanoid()}`,
      userId,
      activityDate,
      runCount,
      totalDistanceMeters,
      totalDurationSeconds,
    });
  }
}

// Get run splits
export async function getRunSplits(
  runId: string
): Promise<{ splitNumber: number; distanceMeters: number; durationSeconds: number; paceSecondsPerKm: number; elevationGainMeters: number }[]> {
  return db.query.runSplits.findMany({
    where: eq(runSplits.runId, runId),
    orderBy: runSplits.splitNumber,
  });
}
