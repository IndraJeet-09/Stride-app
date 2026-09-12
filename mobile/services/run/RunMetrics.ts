import { GPSPoint } from "./types";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: GPSPoint, b: GPSPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfLon * sinHalfLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function calculateAveragePace(
  distanceMeters: number,
  movingDurationSeconds: number
): number | null {
  const distanceKm = distanceMeters / 1000;
  if (distanceKm < 0.01 || movingDurationSeconds <= 0) {
    return null;
  }
  return movingDurationSeconds / distanceKm;
}

export function calculateAverageSpeed(
  distanceMeters: number,
  movingDurationSeconds: number
): number {
  if (movingDurationSeconds <= 0) return 0;
  return distanceMeters / movingDurationSeconds;
}

export function formatPace(paceSecondsPerKm: number | null): string {
  if (paceSecondsPerKm === null || !isFinite(paceSecondsPerKm)) {
    return "--:--";
  }
  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.floor(paceSecondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatElapsed(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100;
}

export function kmString(meters: number): string {
  return metersToKm(meters).toFixed(2);
}
