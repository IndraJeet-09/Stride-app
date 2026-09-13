import { STRIDE_RUN_TYPES, STRIDE_RUN_SPORT_TYPES } from "./config";

/**
 * Determine if a Strava activity should be imported as a run in Stride.
 * Uses sport_type (preferred) with fallback to type.
 */
export function isStrideRun(activity: {
  type: string;
  sport_type?: string;
}): boolean {
  const sportType = activity.sport_type || activity.type;
  return STRIDE_RUN_SPORT_TYPES.has(sportType) || STRIDE_RUN_TYPES.has(activity.type);
}

/**
 * Map a Strava activity type to Stride's normalized type.
 */
export function mapActivityType(
  type: string,
  sportType?: string
): { activityType: string; sportType: string } {
  const st = sportType || type;

  // Direct mapping for run types
  if (STRIDE_RUN_SPORT_TYPES.has(st)) {
    return { activityType: "Run", sportType: st };
  }
  if (STRIDE_RUN_TYPES.has(type)) {
    return { activityType: "Run", sportType: st };
  }

  return { activityType: type, sportType: st };
}
