// Haversine distance calculation
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// GPS point validation
export interface GpsPoint {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  accuracyMeters?: number;
  speedMps?: number;
  headingDegrees?: number;
  recordedAt: Date;
}

export interface GpsFilterConfig {
  maxAccuracyMeters: number;
  maxSpeedMps: number;
  maxJumpMeters: number;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

const DEFAULT_FILTER_CONFIG: GpsFilterConfig = {
  maxAccuracyMeters: 100, // Ignore points with accuracy worse than 100m
  maxSpeedMps: 12.5, // ~45 km/h - max human running speed
  maxJumpMeters: 500, // Max distance between consecutive points
  minLatitude: -90,
  maxLatitude: 90,
  minLongitude: -180,
  maxLongitude: 180,
};

// Validate GPS point
export function validateGpsPoint(
  point: GpsPoint,
  config: GpsFilterConfig = DEFAULT_FILTER_CONFIG
): { valid: boolean; reason?: string } {
  // Check coordinates are valid
  if (
    point.latitude < config.minLatitude ||
    point.latitude > config.maxLatitude
  ) {
    return { valid: false, reason: "Invalid latitude" };
  }

  if (
    point.longitude < config.minLongitude ||
    point.longitude > config.maxLongitude
  ) {
    return { valid: false, reason: "Invalid longitude" };
  }

  // Check accuracy
  if (
    point.accuracyMeters !== undefined &&
    point.accuracyMeters > config.maxAccuracyMeters
  ) {
    return { valid: false, reason: "Poor GPS accuracy" };
  }

  // Check speed
  if (point.speedMps !== undefined && point.speedMps > config.maxSpeedMps) {
    return { valid: false, reason: "Impossible speed" };
  }

  return { valid: true };
}

// Filter and validate GPS points
export function filterGpsPoints(
  points: GpsPoint[],
  config: GpsFilterConfig = DEFAULT_FILTER_CONFIG
): { filtered: GpsPoint[]; rejected: { point: GpsPoint; reason: string }[] } {
  const filtered: GpsPoint[] = [];
  const rejected: { point: GpsPoint; reason: string }[] = [];

  for (const point of points) {
    const validation = validateGpsPoint(point, config);
    if (validation.valid) {
      filtered.push(point);
    } else {
      rejected.push({ point, reason: validation.reason! });
    }
  }

  return { filtered, rejected };
}

// Calculate metrics from GPS points
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

export function calculateMetricsFromGps(
  points: GpsPoint[],
  startedAt: Date,
  endedAt: Date,
  pausedDurationSeconds: number = 0
): RunMetrics {
  if (points.length < 2) {
    return {
      distanceMeters: 0,
      durationSeconds: Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
      movingDurationSeconds: Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000) - pausedDurationSeconds,
      averagePaceSecondsPerKm: 0,
      averageSpeedMps: 0,
      maxSpeedMps: 0,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
    };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  // Sort points by recorded time
  const sortedPoints = [...points].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );

  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];

    // Calculate distance
    const distance = calculateHaversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
    totalDistance += distance;

    // Track max speed
    if (curr.speedMps !== undefined && curr.speedMps > maxSpeed) {
      maxSpeed = curr.speedMps;
    }

    // Calculate elevation
    if (prev.altitudeMeters !== undefined && curr.altitudeMeters !== undefined) {
      const elevationDiff = curr.altitudeMeters - prev.altitudeMeters;
      if (elevationDiff > 0) {
        elevationGain += elevationDiff;
      } else {
        elevationLoss += Math.abs(elevationDiff);
      }
    }
  }

  const durationSeconds = Math.floor(
    (endedAt.getTime() - startedAt.getTime()) / 1000
  );
  const movingDurationSeconds = durationSeconds - pausedDurationSeconds;

  // Calculate pace and speed
  const distanceKm = totalDistance / 1000;
  const averagePaceSecondsPerKm =
    distanceKm > 0 ? Math.floor(movingDurationSeconds / distanceKm) : 0;
  const averageSpeedMps =
    movingDurationSeconds > 0 ? totalDistance / movingDurationSeconds : 0;

  return {
    distanceMeters: totalDistance,
    durationSeconds,
    movingDurationSeconds,
    averagePaceSecondsPerKm,
    averageSpeedMps,
    maxSpeedMps: maxSpeed,
    elevationGainMeters: Math.round(elevationGain),
    elevationLossMeters: Math.round(elevationLoss),
  };
}

// Generate KM splits from track points
export interface Split {
  splitNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number;
  elevationGainMeters: number;
}

export function generateSplits(
  points: GpsPoint[],
  totalDistanceMeters: number
): Split[] {
  if (points.length < 2 || totalDistanceMeters <= 0) {
    return [];
  }

  const splits: Split[] = [];
  const sortedPoints = [...points].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );

  let currentSplit = 1;
  let distanceInSplit = 0;
  let splitStartTime = sortedPoints[0].recordedAt;
  let elevationGainInSplit = 0;
  let lastAltitude = sortedPoints[0].altitudeMeters;

  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];

    const segmentDistance = calculateHaversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );

    // Check if we've completed a kilometer
    if (distanceInSplit + segmentDistance >= 1000 && currentSplit < Math.ceil(totalDistanceMeters / 1000)) {
      // Calculate split metrics
      const splitDuration = Math.floor(
        (curr.recordedAt.getTime() - splitStartTime.getTime()) / 1000
      );
      const paceSecondsPerKm = splitDuration;

      splits.push({
        splitNumber: currentSplit,
        distanceMeters: 1000,
        durationSeconds: splitDuration,
        paceSecondsPerKm,
        elevationGainMeters: Math.round(elevationGainInSplit),
      });

      // Reset for next split
      currentSplit++;
      distanceInSplit = 0;
      splitStartTime = curr.recordedAt;
      elevationGainInSplit = 0;
    } else {
      distanceInSplit += segmentDistance;
    }

    // Track elevation
    if (lastAltitude !== undefined && curr.altitudeMeters !== undefined) {
      const diff = curr.altitudeMeters - lastAltitude;
      if (diff > 0) {
        elevationGainInSplit += diff;
      }
    }
    lastAltitude = curr.altitudeMeters;
  }

  // Add final partial split if needed
  if (distanceInSplit > 0 && currentSplit <= Math.ceil(totalDistanceMeters / 1000)) {
    const splitDuration = Math.floor(
      (sortedPoints[sortedPoints.length - 1].recordedAt.getTime() - splitStartTime.getTime()) / 1000
    );
    const paceSecondsPerKm = distanceInSplit > 0 
      ? Math.floor((splitDuration / distanceInSplit) * 1000)
      : 0;

    splits.push({
      splitNumber: currentSplit,
      distanceMeters: distanceInSplit,
      durationSeconds: splitDuration,
      paceSecondsPerKm,
      elevationGainMeters: Math.round(elevationGainInSplit),
    });
  }

  return splits;
}

// Calculate contribution level from distance
export function calculateContributionLevel(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000;

  if (distanceKm === 0) return 0;
  if (distanceKm < 3) return 1;
  if (distanceKm < 6) return 2;
  if (distanceKm < 10) return 3;
  return 4;
}

// Format utilities
export function formatPace(paceSecondsPerKm: number): string {
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = paceSecondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}
