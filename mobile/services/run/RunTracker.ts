import * as Location from "expo-location";
import {
  RunTrackerState,
  RunFinishResult,
  GPSPoint,
  PausePeriod,
  PendingTrackPoint,
  createInitialState,
} from "./types";
import { GPSFilter, createGPSFilter } from "./GPSFilter";
import { haversineDistance, calculateAveragePace, calculateAverageSpeed } from "./RunMetrics";
import { startLocationTracking, LocationTrackingHandle } from "./LocationTracker";
import { StrideAPI } from "@/lib/api/client";

type StateListener = (state: RunTrackerState) => void;

const BATCH_SIZE = 20;
const BATCH_INTERVAL_MS = 15000;

class RunTrackerService {
  private state: RunTrackerState = createInitialState();
  private listeners: StateListener[] = [];
  private gpsFilter: GPSFilter = createGPSFilter();
  private locationHandle: LocationTrackingHandle | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private pausePeriods: PausePeriod[] = [];
  private pendingPoints: PendingTrackPoint[] = [];
  private sequenceCounter = 0;
  private lastSyncTime = 0;
  private syncInProgress = false;

  getState(): RunTrackerState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  private setState(partial: Partial<RunTrackerState>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  private computePausedMs(now: number): number {
    let total = 0;
    for (const period of this.pausePeriods) {
      if (period.endedAt !== null) {
        total += period.endedAt - period.startedAt;
      } else {
        total += now - period.startedAt;
      }
    }
    return total;
  }

  async startRun(): Promise<void> {
    if (this.state.status !== "idle" && this.state.status !== "error") {
      return;
    }

    this.setState({ status: "requesting_permission", error: null });

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      this.setState({
        status: "error",
        error: "Location permission is required to track your run.",
      });
      return;
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      this.setState({
        status: "error",
        error: "Location services are disabled. Please enable GPS in your device settings.",
      });
      return;
    }

    const clientRunId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    this.setState({
      status: "starting",
      clientRunId,
      startedAt,
    });

    const res = await StrideAPI.startRun({
      clientRunId,
      startedAt: new Date(startedAt).toISOString(),
      timezone,
    });

    const runId = res.data?.id ?? null;
    this.setState({ runId });

    this.gpsFilter = createGPSFilter();
    this.pausePeriods = [];
    this.pendingPoints = [];
    this.sequenceCounter = 0;
    this.lastSyncTime = 0;

    this.setState({ status: "running" });
    this.startGPS();
    this.startTimer();
  }

  private startGPS() {
    this.locationHandle = startLocationTracking(
      (point) => this.onLocationReceived(point),
      (error) => {
        if (this.state.status === "running" || this.state.status === "paused") {
          this.setState({ error });
        }
      }
    );
  }

  private onLocationReceived(point: GPSPoint) {
    if (this.state.status !== "running") return;

    const lastAccepted =
      this.state.trackPoints.length > 0
        ? this.state.trackPoints[this.state.trackPoints.length - 1]
        : null;

    const accepted = this.gpsFilter.acceptPoint(point, lastAccepted);
    if (!accepted) return;

    let segmentDist = 0;
    if (lastAccepted) {
      segmentDist = haversineDistance(lastAccepted, accepted);
    }

    const newDistance = this.state.distanceMeters + segmentDist;
    const newTrackPoints = [...this.state.trackPoints, accepted];

    this.sequenceCounter++;
    this.pendingPoints.push({
      sequence: this.sequenceCounter,
      latitude: accepted.latitude,
      longitude: accepted.longitude,
      altitudeMeters: accepted.altitude,
      accuracyMeters: accepted.accuracy,
      speedMps: accepted.speed,
      headingDegrees: accepted.heading,
      recordedAt: new Date(accepted.timestamp).toISOString(),
    });

    const now = Date.now();
    const pausedMs = this.computePausedMs(now);
    const movingSec = Math.floor((now - (this.state.startedAt ?? now) - pausedMs) / 1000);

    this.setState({
      distanceMeters: newDistance,
      trackPoints: newTrackPoints,
      currentLocation: accepted,
      gpsAccuracy: accepted.accuracy,
      movingDurationSeconds: movingSec,
      averagePaceSecondsPerKm: calculateAveragePace(newDistance, movingSec),
      averageSpeedMps: calculateAverageSpeed(newDistance, movingSec),
    });

    this.maybeSyncTrackPoints();
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.status !== "running" && this.state.status !== "paused") {
        return;
      }
      const now = Date.now();
      const startedAt = this.state.startedAt ?? now;
      const totalElapsed = Math.floor((now - startedAt) / 1000);
      const pausedMs = this.computePausedMs(now);
      const movingSec = Math.floor((now - startedAt - pausedMs) / 1000);

      this.setState({
        elapsedSeconds: totalElapsed,
        movingDurationSeconds: movingSec,
        averagePaceSecondsPerKm: calculateAveragePace(
          this.state.distanceMeters,
          movingSec
        ),
        averageSpeedMps: calculateAverageSpeed(
          this.state.distanceMeters,
          movingSec
        ),
      });
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private async maybeSyncTrackPoints() {
    if (!this.state.runId) return;
    if (this.syncInProgress) return;
    if (
      this.pendingPoints.length < BATCH_SIZE &&
      Date.now() - this.lastSyncTime < BATCH_INTERVAL_MS
    ) {
      return;
    }

    this.syncInProgress = true;
    const batch = [...this.pendingPoints];

    try {
      const result = await StrideAPI.ingestTrackPoints(this.state.runId, batch);
      if (result.data) {
        this.pendingPoints = this.pendingPoints.filter(
          (p) => p.sequence > result.data!.lastSequence
        );
        this.lastSyncTime = Date.now();
      }
    } catch {
      // Keep pending points for retry
    } finally {
      this.syncInProgress = false;
    }
  }

  async pauseRun(): Promise<void> {
    if (this.state.status !== "running") return;

    this.stopTimer();
    this.pausePeriods.push({ startedAt: Date.now(), endedAt: null });
    this.setState({ status: "paused" });

    if (this.state.runId) {
      await StrideAPI.pauseRun(this.state.runId);
    }
  }

  async resumeRun(): Promise<void> {
    if (this.state.status !== "paused") return;

    const lastPeriod = this.pausePeriods[this.pausePeriods.length - 1];
    if (lastPeriod && lastPeriod.endedAt === null) {
      lastPeriod.endedAt = Date.now();
    }

    this.setState({ status: "running" });
    this.startTimer();

    if (this.state.runId) {
      await StrideAPI.resumeRun(this.state.runId);
    }
  }

  async finishRun(): Promise<RunFinishResult | null> {
    if (this.state.status !== "running" && this.state.status !== "paused") {
      return null;
    }

    this.setState({ status: "finishing" });
    this.stopTimer();
    this.locationHandle?.stop();
    this.locationHandle = null;

    if (this.state.status === "paused") {
      const lastPeriod = this.pausePeriods[this.pausePeriods.length - 1];
      if (lastPeriod && lastPeriod.endedAt === null) {
        lastPeriod.endedAt = Date.now();
      }
    }

    if (this.pendingPoints.length > 0 && this.state.runId) {
      try {
        await StrideAPI.ingestTrackPoints(this.state.runId, this.pendingPoints);
      } catch {
        // Proceed to finish anyway — points remain locally
      }
    }

    let serverMetrics: any = null;
    if (this.state.runId) {
      const res = await StrideAPI.finishRun(
        this.state.runId,
        new Date().toISOString()
      );
      serverMetrics = res.data;
    }

    const result: RunFinishResult = {
      runId: this.state.runId ?? this.state.clientRunId,
      distanceMeters: serverMetrics?.distanceMeters ?? this.state.distanceMeters,
      movingDurationSeconds:
        serverMetrics?.movingDurationSeconds ?? this.state.movingDurationSeconds,
      elapsedSeconds: this.state.elapsedSeconds,
      averagePaceSecondsPerKm:
        serverMetrics?.averagePaceSecondsPerKm ??
        this.state.averagePaceSecondsPerKm,
      averageSpeedMps:
        serverMetrics?.averageSpeedMps ?? this.state.averageSpeedMps ?? 0,
      elevationGainMeters: serverMetrics?.elevationGainMeters ?? 0,
      calories: serverMetrics?.calories ?? 0,
    };

    this.resetState();
    return result;
  }

  async discardRun(): Promise<void> {
    this.stopTimer();
    this.locationHandle?.stop();
    this.locationHandle = null;

    if (this.state.runId) {
      await StrideAPI.discardRun(this.state.runId);
    }

    this.resetState();
  }

  private resetState() {
    this.state = createInitialState();
    this.gpsFilter = createGPSFilter();
    this.pausePeriods = [];
    this.pendingPoints = [];
    this.sequenceCounter = 0;
    this.lastSyncTime = 0;
    this.syncInProgress = false;
    this.emit();
  }

  cleanup() {
    this.stopTimer();
    this.locationHandle?.stop();
    this.locationHandle = null;
  }
}

export const RunTracker = new RunTrackerService();
