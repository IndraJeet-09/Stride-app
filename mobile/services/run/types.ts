export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface GPSFilterConfig {
  MAX_ACCEPTABLE_ACCURACY_METERS: number;
  MAX_REASONABLE_SPEED_MPS: number;
  MIN_DISTANCE_METERS: number;
  MIN_TIME_BETWEEN_POINTS_MS: number;
}

export const DEFAULT_GPS_FILTER_CONFIG: GPSFilterConfig = {
  MAX_ACCEPTABLE_ACCURACY_METERS: 50,
  MAX_REASONABLE_SPEED_MPS: 12,
  MIN_DISTANCE_METERS: 2.5,
  MIN_TIME_BETWEEN_POINTS_MS: 1000,
};

export type RunStatus =
  | "idle"
  | "requesting_permission"
  | "starting"
  | "running"
  | "paused"
  | "finishing"
  | "error";

export interface RunTrackerState {
  status: RunStatus;
  runId: string | null;
  clientRunId: string;
  startedAt: number | null;
  totalPausedMs: number;
  distanceMeters: number;
  elapsedSeconds: number;
  movingDurationSeconds: number;
  averagePaceSecondsPerKm: number | null;
  averageSpeedMps: number | null;
  currentLocation: GPSPoint | null;
  trackPoints: GPSPoint[];
  gpsAccuracy: number | null;
  error: string | null;
}

export interface PausePeriod {
  startedAt: number;
  endedAt: number | null;
}

export interface PendingTrackPoint {
  sequence: number;
  latitude: number;
  longitude: number;
  altitudeMeters?: number | null;
  accuracyMeters?: number | null;
  speedMps?: number | null;
  headingDegrees?: number | null;
  recordedAt: string;
}

export interface RunFinishResult {
  runId: string;
  distanceMeters: number;
  movingDurationSeconds: number;
  elapsedSeconds: number;
  averagePaceSecondsPerKm: number | null;
  averageSpeedMps: number;
  elevationGainMeters: number;
  calories: number;
}

export function createInitialState(): RunTrackerState {
  return {
    status: "idle",
    runId: null,
    clientRunId: "",
    startedAt: null,
    totalPausedMs: 0,
    distanceMeters: 0,
    elapsedSeconds: 0,
    movingDurationSeconds: 0,
    averagePaceSecondsPerKm: null,
    averageSpeedMps: null,
    currentLocation: null,
    trackPoints: [],
    gpsAccuracy: null,
    error: null,
  };
}
