import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { IntensityLevel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Maps total daily distance to 5-level ember contribution intensity scale
 */
export function getDistanceIntensity(distanceKm: number): IntensityLevel {
  if (distanceKm <= 0) return 0;
  if (distanceKm < 2.5) return 1;
  if (distanceKm < 5.0) return 2;
  if (distanceKm < 10.0) return 3;
  return 4;
}

/**
 * Returns hex color code for given intensity level
 */
export function getContributionHexColor(level: IntensityLevel): string {
  switch (level) {
    case 0:
      return "#181818";
    case 1:
      return "#4A1D12";
    case 2:
      return "#71301A";
    case 3:
      return "#9F3A18";
    case 4:
      return "#C2410C";
    default:
      return "#181818";
  }
}

export function formatDistance(km: number): string {
  if (km === 0) return "0 km";
  return `${km.toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function calculatePace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm <= 0 || durationSeconds <= 0) return "0:00 /km";
  const secondsPerKm = Math.round(durationSeconds / distanceKm);
  const mins = Math.floor(secondsPerKm / 60);
  const secs = secondsPerKm % 60;
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
}

// --- API conversion helpers ---

export function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100;
}

export function metersToKmString(meters: number): string {
  return metersToKm(meters).toFixed(2);
}

export function paceSecondsToString(secPerKm: number): string {
  const mins = Math.floor(secPerKm / 60);
  const secs = secPerKm % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function paceSecondsToDisplay(secPerKm: number): string {
  return `${paceSecondsToString(secPerKm)} /km`;
}

export function metersToFeet(meters: number): number {
  return Math.round(meters * 3.28084);
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  let hrs = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12 || 12;
  return `${hrs}:${mins} ${ampm}`;
}

export function formatRunDate(isoString: string): string {
  const d = new Date(isoString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
