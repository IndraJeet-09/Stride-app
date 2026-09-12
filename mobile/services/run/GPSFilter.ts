import { GPSPoint, GPSFilterConfig, DEFAULT_GPS_FILTER_CONFIG } from "./types";

export interface GPSFilter {
  acceptPoint(point: GPSPoint, lastAccepted: GPSPoint | null): GPSPoint | null;
  reset(): void;
}

export function createGPSFilter(
  config: Partial<GPSFilterConfig> = {}
): GPSFilter {
  const cfg = { ...DEFAULT_GPS_FILTER_CONFIG, ...config };
  let lastAcceptedTimestamp = 0;

  function acceptPoint(
    point: GPSPoint,
    lastAccepted: GPSPoint | null
  ): GPSPoint | null {
    if (
      !isFinite(point.latitude) ||
      !isFinite(point.longitude) ||
      point.latitude < -90 ||
      point.latitude > 90 ||
      point.longitude < -180 ||
      point.longitude > 180
    ) {
      return null;
    }

    if (
      point.accuracy !== null &&
      point.accuracy > cfg.MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      return null;
    }

    const timeSinceLast =
      point.timestamp - lastAcceptedTimestamp;
    if (
      lastAcceptedTimestamp > 0 &&
      timeSinceLast < cfg.MIN_TIME_BETWEEN_POINTS_MS
    ) {
      return null;
    }

    if (lastAccepted) {
      const dist = haversine(
        lastAccepted.latitude,
        lastAccepted.longitude,
        point.latitude,
        point.longitude
      );

      if (dist < cfg.MIN_DISTANCE_METERS) {
        return null;
      }

      const timeSeconds = (point.timestamp - lastAccepted.timestamp) / 1000;
      if (timeSeconds > 0) {
        const speed = dist / timeSeconds;
        if (speed > cfg.MAX_REASONABLE_SPEED_MPS) {
          return null;
        }
      }
    }

    lastAcceptedTimestamp = point.timestamp;
    return point;
  }

  function reset() {
    lastAcceptedTimestamp = 0;
  }

  return { acceptPoint, reset };
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
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
