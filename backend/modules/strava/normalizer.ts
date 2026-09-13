import type { StravaSummaryActivity, NormalizedRun } from "./types";
import { mapActivityType } from "./activity-mapper";

/**
 * Calculate average pace in seconds per km from speed in m/s.
 * pace = 1000 / speed_mps (seconds per km)
 */
function speedToPace(speedMps: number): number {
  if (speedMps <= 0) return 0;
  return Math.round(1000 / speedMps);
}

/**
 * Normalize a Strava SummaryActivity into Stride's internal run format.
 */
export function normalizeStravaActivity(
  activity: StravaSummaryActivity
): NormalizedRun {
  const { activityType, sportType } = mapActivityType(
    activity.type,
    activity.sport_type
  );

  return {
    stravaActivityId: String(activity.id),
    name: activity.name || "Untitled Activity",
    activityType,
    sportType,
    startedAt: new Date(activity.start_date),
    startedAtLocal: new Date(activity.start_date_local),
    timezone: activity.timezone || "UTC",
    distanceMeters: activity.distance || 0,
    movingTimeSeconds: activity.moving_time || 0,
    elapsedTimeSeconds: activity.elapsed_time || 0,
    elevationGainMeters: activity.total_elevation_gain || 0,
    averageSpeedMps: activity.average_speed || 0,
    maxSpeedMps: activity.max_speed || 0,
    averagePaceSecondsPerKm: speedToPace(activity.average_speed || 0),
    averageHeartrate: activity.average_heartrate || null,
    maxHeartrate: activity.max_heartrate || null,
    calories: activity.calories || 0,
    trainer: activity.trainer || false,
    commute: activity.commute || false,
    private: activity.private || false,
    stravaUrl: `https://www.strava.com/activities/${activity.id}`,
  };
}
