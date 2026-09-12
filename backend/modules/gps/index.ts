import { db } from "@/db";
import { runTrackPoints, runs, runPausePeriods } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { filterGpsPoints, validateGpsPoint, type GpsPoint } from "@/lib/geo";
import { logRunEvent, logError } from "@/lib/logging";

export interface TrackPointInput {
  sequence: number;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  accuracyMeters?: number;
  speedMps?: number;
  headingDegrees?: number;
  recordedAt: string;
}

export interface IngestResult {
  acceptedCount: number;
  rejectedCount: number;
  lastSequence: number;
  rejected: { point: TrackPointInput; reason: string }[];
}

// Batch ingest GPS track points
export async function ingestTrackPoints(
  runId: string,
  points: TrackPointInput[]
): Promise<IngestResult> {
  // Convert input to GpsPoint format for filtering
  const gpsPoints: GpsPoint[] = points.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    altitudeMeters: p.altitudeMeters,
    accuracyMeters: p.accuracyMeters,
    speedMps: p.speedMps,
    headingDegrees: p.headingDegrees,
    recordedAt: new Date(p.recordedAt),
  }));

  // Filter invalid points, mapping rejected back to original TrackPointInput
  const filtered: GpsPoint[] = [];
  const rejected: { point: TrackPointInput; reason: string }[] = [];
  for (let i = 0; i < gpsPoints.length; i++) {
    const validation = validateGpsPoint(gpsPoints[i]);
    if (validation.valid) {
      filtered.push(gpsPoints[i]);
    } else {
      rejected.push({ point: points[i], reason: validation.reason! });
    }
  }

  // Get existing sequences for idempotency check
  const existingPoints = await db.query.runTrackPoints.findMany({
    where: eq(runTrackPoints.runId, runId),
    columns: { sequence: true },
  });

  const existingSequences = new Set(existingPoints.map((p) => p.sequence));

  // Filter out duplicates
  const newPoints = points.filter((p) => !existingSequences.has(p.sequence));

  if (newPoints.length === 0) {
    return {
      acceptedCount: 0,
      rejectedCount: rejected.length,
      lastSequence: Math.max(...existingSequences, 0),
      rejected,
    };
  }

  // Insert new points
  const insertData = newPoints.map((point) => ({
    id: `tp_${nanoid()}`,
    runId,
    sequence: point.sequence,
    latitude: point.latitude,
    longitude: point.longitude,
    altitudeMeters: point.altitudeMeters,
    accuracyMeters: point.accuracyMeters,
    speedMps: point.speedMps,
    headingDegrees: point.headingDegrees,
    recordedAt: new Date(point.recordedAt),
  }));

  try {
    await db.insert(runTrackPoints).values(insertData);
  } catch (error) {
    logError(error, { runId, pointsCount: newPoints.length });
    throw error;
  }

  // Get all sequences including new ones
  const allPoints = await db.query.runTrackPoints.findMany({
    where: eq(runTrackPoints.runId, runId),
    columns: { sequence: true },
    orderBy: desc(runTrackPoints.sequence),
  });

  const lastSequence = allPoints.length > 0 ? allPoints[0].sequence : 0;

  logRunEvent("gps_uploaded", {
    runId,
    acceptedCount: newPoints.length,
    rejectedCount: rejected.length,
    lastSequence,
  });

  return {
    acceptedCount: newPoints.length,
    rejectedCount: rejected.length,
    lastSequence,
    rejected,
  };
}

// Get all track points for a run
export async function getTrackPoints(runId: string): Promise<GpsPoint[]> {
  const points = await db.query.runTrackPoints.findMany({
    where: eq(runTrackPoints.runId, runId),
    orderBy: runTrackPoints.sequence,
  });

  return points.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    altitudeMeters: p.altitudeMeters ?? undefined,
    accuracyMeters: p.accuracyMeters ?? undefined,
    speedMps: p.speedMps ?? undefined,
    headingDegrees: p.headingDegrees ?? undefined,
    recordedAt: p.recordedAt,
  }));
}

// Get pause periods for a run
export async function getPausePeriods(
  runId: string
): Promise<{ startedAt: Date; endedAt: Date | null }[]> {
  const pauses = await db.query.runPausePeriods.findMany({
    where: eq(runPausePeriods.runId, runId),
    orderBy: runPausePeriods.startedAt,
  });

  return pauses.map((p) => ({
    startedAt: p.startedAt,
    endedAt: p.endedAt,
  }));
}

// Calculate total paused duration
export async function calculatePausedDuration(runId: string): Promise<number> {
  const pauses = await db.query.runPausePeriods.findMany({
    where: eq(runPausePeriods.runId, runId),
  });

  let totalPaused = 0;
  for (const pause of pauses) {
    if (pause.endedAt) {
      totalPaused += Math.floor(
        (pause.endedAt.getTime() - pause.startedAt.getTime()) / 1000
      );
    }
  }

  return totalPaused;
}
