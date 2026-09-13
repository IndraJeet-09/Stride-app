import { db } from "@/db";
import { runs, dailyActivities, stravaConnections } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAllActivities } from "./client";
import { isStrideRun } from "./activity-mapper";
import { normalizeStravaActivity } from "./normalizer";
import { updateSyncStatus, getStravaConnection } from "./connection";
import type { NormalizedRun } from "./types";

/**
 * Get the date string in the user's local timezone for contribution tracking.
 */
function getActivityDate(
  startDateLocal: Date,
  timezone: string
): string {
  try {
    // Use the local date from Strava (already in user's timezone)
    const year = startDateLocal.getFullYear();
    const month = String(startDateLocal.getMonth() + 1).padStart(2, "0");
    const day = String(startDateLocal.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    // Fallback to UTC
    return startDateLocal.toISOString().split("T")[0];
  }
}

/**
 * Upsert a single run (insert or update based on strava_activity_id).
 */
async function upsertRun(
  userId: string,
  normalized: NormalizedRun
): Promise<{ isNew: boolean }> {
  // Check for existing run with this Strava activity ID
  const existing = await db.query.runs.findFirst({
    where: and(
      eq(runs.userId, userId),
      eq(runs.stravaActivityId, normalized.stravaActivityId)
    ),
  });

  if (existing) {
    // Update existing run
    await db
      .update(runs)
      .set({
        name: normalized.name,
        activityType: normalized.activityType,
        sportType: normalized.sportType,
        startedAt: normalized.startedAt,
        endedAt: new Date(normalized.startedAt.getTime() + normalized.elapsedTimeSeconds * 1000),
        startedAtLocal: normalized.startedAtLocal,
        timezone: normalized.timezone,
        distanceMeters: normalized.distanceMeters,
        movingDurationSeconds: normalized.movingTimeSeconds,
        elapsedTimeSeconds: normalized.elapsedTimeSeconds,
        averageSpeedMps: normalized.averageSpeedMps,
        maxSpeedMps: normalized.maxSpeedMps,
        averagePaceSecondsPerKm: normalized.averagePaceSecondsPerKm,
        elevationGainMeters: normalized.elevationGainMeters,
        averageHeartrate: normalized.averageHeartrate,
        maxHeartrate: normalized.maxHeartrate,
        calories: normalized.calories,
        trainer: normalized.trainer,
        commute: normalized.commute,
        private: normalized.private,
        stravaUrl: normalized.stravaUrl,
        updatedAt: new Date(),
      })
      .where(eq(runs.id, existing.id));

    return { isNew: false };
  }

  // Insert new run
  const runId = `run_${nanoid()}`;
  await db.insert(runs).values({
    id: runId,
    userId,
    stravaActivityId: normalized.stravaActivityId,
    name: normalized.name,
    activityType: normalized.activityType,
    sportType: normalized.sportType,
    startedAt: normalized.startedAt,
    endedAt: new Date(normalized.startedAt.getTime() + normalized.elapsedTimeSeconds * 1000),
    startedAtLocal: normalized.startedAtLocal,
    timezone: normalized.timezone,
    distanceMeters: normalized.distanceMeters,
    movingDurationSeconds: normalized.movingTimeSeconds,
    elapsedTimeSeconds: normalized.elapsedTimeSeconds,
    averageSpeedMps: normalized.averageSpeedMps,
    maxSpeedMps: normalized.maxSpeedMps,
    averagePaceSecondsPerKm: normalized.averagePaceSecondsPerKm,
    elevationGainMeters: normalized.elevationGainMeters,
    averageHeartrate: normalized.averageHeartrate,
    maxHeartrate: normalized.maxHeartrate,
    calories: normalized.calories,
    trainer: normalized.trainer,
    commute: normalized.commute,
    private: normalized.private,
    stravaUrl: normalized.stravaUrl,
    visibility: "private",
  });

  return { isNew: true };
}

/**
 * Recalculate daily activity aggregations for affected dates.
 */
async function recalculateDailyActivities(
  userId: string,
  dates: string[]
): Promise<void> {
  // Fetch all runs for this user (we filter by date client-side to handle timezone correctly)
  const allRuns = await db.query.runs.findMany({
    where: eq(runs.userId, userId),
  });

  for (const dateStr of dates) {
    // Filter runs to those on this specific date using local time
    const filteredRuns = allRuns.filter((run) => {
      const runDate = getActivityDate(
        run.startedAtLocal || run.startedAt,
        run.timezone
      );
      return runDate === dateStr;
    });

    const runCount = filteredRuns.length;
    const totalDistanceMeters = filteredRuns.reduce(
      (sum, run) => sum + (run.distanceMeters || 0),
      0
    );
    const totalDurationSeconds = filteredRuns.reduce(
      (sum, run) => sum + (run.movingDurationSeconds || 0),
      0
    );

    // Check if daily activity exists
    const existing = await db.query.dailyActivities.findFirst({
      where: and(
        eq(dailyActivities.userId, userId),
        eq(dailyActivities.activityDate, dateStr)
      ),
    });

    if (existing) {
      if (runCount === 0) {
        // Delete the daily activity if no runs on this date
        await db
          .delete(dailyActivities)
          .where(eq(dailyActivities.id, existing.id));
      } else {
        await db
          .update(dailyActivities)
          .set({
            runCount,
            totalDistanceMeters,
            totalDurationSeconds,
            updatedAt: new Date(),
          })
          .where(eq(dailyActivities.id, existing.id));
      }
    } else if (runCount > 0) {
      await db.insert(dailyActivities).values({
        id: `da_${nanoid()}`,
        userId,
        activityDate: dateStr,
        runCount,
        totalDistanceMeters,
        totalDurationSeconds,
      });
    }
  }
}

/**
 * Sync all activities from Strava for a user.
 * Handles initial full sync and incremental sync.
 */
export async function syncActivities(
  userId: string,
  options: {
    incremental?: boolean;
    after?: Date;
    onProgress?: (fetched: number, inserted: number, updated: number) => void;
  } = {}
): Promise<{ total: number; inserted: number; updated: number }> {
  const connection = await getStravaConnection(userId);
  if (!connection) {
    throw new Error("No active Strava connection");
  }

  await updateSyncStatus(userId, "syncing");

  try {
    // Determine the "after" timestamp for incremental sync
    let afterTimestamp: number | undefined;
    if (options.incremental && connection.lastSyncCompletedAt) {
      afterTimestamp = Math.floor(
        connection.lastSyncCompletedAt.getTime() / 1000
      );
    } else if (options.after) {
      afterTimestamp = Math.floor(options.after.getTime() / 1000);
    }

    // Fetch all activities from Strava
    const stravaActivities = await getAllActivities(userId, {
      after: afterTimestamp,
      perPage: 100,
      onProgress: (fetched) => {
        options.onProgress?.(fetched, 0, 0);
      },
    });

    // Filter to running activities only
    const runActivities = stravaActivities.filter(isStrideRun);

    // Normalize and upsert
    let inserted = 0;
    let updated = 0;
    const affectedDates = new Set<string>();

    for (const activity of runActivities) {
      const normalized = normalizeStravaActivity(activity);
      const result = await upsertRun(userId, normalized);

      if (result.isNew) {
        inserted++;
      } else {
        updated++;
      }

      // Track affected dates for daily activity recalculation
      const dateStr = getActivityDate(
        normalized.startedAtLocal,
        normalized.timezone
      );
      affectedDates.add(dateStr);

      options.onProgress?.(stravaActivities.length, inserted, updated);
    }

    // Recalculate daily activities for affected dates
    await recalculateDailyActivities(userId, Array.from(affectedDates));

    // Mark sync complete
    await updateSyncStatus(userId, "complete");

    return {
      total: runActivities.length,
      inserted,
      updated,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";
    await updateSyncStatus(userId, "failed", message);
    throw error;
  }
}

/**
 * Handle a single activity event from a webhook.
 */
export async function handleActivityEvent(
  ownerId: number,
  aspectType: "create" | "update" | "delete",
  objectId: number,
  updates?: Record<string, string>
): Promise<void> {
  // Find the Stride user by Strava athlete ID (any active connection, not just "complete")
  const connection = await db.query.stravaConnections.findFirst({
    where: eq(stravaConnections.stravaAthleteId, String(ownerId)),
  });

  if (!connection || connection.disconnectedAt) return;

  const userId = connection.userId;

  if (aspectType === "delete") {
    // Remove the run
    await db
      .update(runs)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(runs.userId, userId),
          eq(runs.stravaActivityId, String(objectId))
        )
      );
    return;
  }

  // For create/update, trigger an incremental sync
  try {
    await syncActivities(userId, { incremental: true });
  } catch {
    // Webhook processing should not throw
  }
}
