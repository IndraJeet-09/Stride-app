# Offline Sync Strategy

## Overview

Stride supports offline-first running. The mobile app can start runs, record GPS, and finish runs without network connectivity. Data syncs when connectivity returns.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  MOBILE APP (Offline Capable)                       │
│                                                     │
│  1. Start Run → Generate clientRunId                │
│  2. Record GPS → Store locally                      │
│  3. Finish Run → Calculate local metrics            │
│  4. Network Returns → Sync to server                │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (Idempotent API)                           │
│                                                     │
│  1. Accept clientRunId                              │
│  2. Check for duplicate                             │
│  3. Create or return existing run                   │
│  4. Accept batch GPS (idempotent by sequence)       │
│  5. Calculate canonical metrics on finish           │
└─────────────────────────────────────────────────────┘
```

## Key Concepts

### clientRunId

The mobile app generates a UUID for each run before starting:

```typescript
import { v4 as uuidv4 } from 'uuid';

const clientRunId = uuidv4(); // "550e8400-e29b-41d4-a716-446655440000"
```

This ID is:
- Unique per user
- Generated client-side
- Sent to server on run start
- Used for idempotency

### Idempotent Operations

#### Start Run
```typescript
// First request
POST /api/v1/runs
{
  "clientRunId": "550e8400-...",
  "startedAt": "2026-09-12T06:45:00Z"
}
// Response: 201 Created

// Retry (after timeout/network error)
POST /api/v1/runs
{
  "clientRunId": "550e8400-...",
  "startedAt": "2026-09-12T06:45:00Z"
}
// Response: 200 OK (returns existing run)
```

#### Upload Track Points
```typescript
// First batch
POST /api/v1/runs/:id/track-points
{
  "points": [
    { "sequence": 1, "latitude": 12.97, "longitude": 77.59, ... },
    { "sequence": 2, "latitude": 12.98, "longitude": 77.60, ... }
  ]
}
// Response: { acceptedCount: 2 }

// Retry (duplicate sequences ignored)
POST /api/v1/runs/:id/track-points
{
  "points": [
    { "sequence": 1, "latitude": 12.97, "longitude": 77.59, ... },
    { "sequence": 2, "latitude": 12.98, "longitude": 77.60, ... }
  ]
}
// Response: { acceptedCount: 0 }
```

## Sync Flow

### 1. Start Run (Offline)

```typescript
// Mobile generates clientRunId
const clientRunId = uuidv4();

// Store locally
await AsyncStorage.setItem(`run_${clientRunId}`, JSON.stringify({
  clientRunId,
  startedAt: new Date().toISOString(),
  status: 'recording',
  trackPoints: [],
}));

// Try to sync (may fail)
try {
  const { data } = await StrideAPI.startRun({
    clientRunId,
    startedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(`run_${clientRunId}_serverId`, data.run.id);
} catch (error) {
  // Will retry later
}
```

### 2. Record GPS (Offline)

```typescript
// Store track points locally
const points = await AsyncStorage.getItem(`run_${clientRunId}_points`);
const parsedPoints = points ? JSON.parse(points) : [];

parsedPoints.push({
  sequence: parsedPoints.length + 1,
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  altitudeMeters: location.coords.altitude,
  accuracyMeters: location.coords.accuracy,
  speedMps: location.coords.speed,
  recordedAt: new Date().toISOString(),
});

await AsyncStorage.setItem(`run_${clientRunId}_points`, JSON.stringify(parsedPoints));
```

### 3. Finish Run (Offline)

```typescript
// Calculate local metrics
const localMetrics = calculateLocalMetrics(parsedPoints);

// Store finish data
await AsyncStorage.setItem(`run_${clientRunId}_finish`, JSON.stringify({
  endedAt: new Date().toISOString(),
  localMetrics,
}));

// Try to sync
try {
  const serverId = await AsyncStorage.getItem(`run_${clientRunId}_serverId`);
  if (serverId) {
    await StrideAPI.finishRun(serverId, new Date().toISOString());
  }
} catch (error) {
  // Will retry later
}
```

### 4. Sync When Online

```typescript
// On app start or network reconnect
const syncPendingRuns = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const runKeys = keys.filter(k => k.startsWith('run_') && k.endsWith('_finish'));

  for (const key of runKeys) {
    const clientRunId = key.replace('run_', '').replace('_finish', '');
    
    try {
      // 1. Start run (idempotent)
      const { data: runData } = await StrideAPI.startRun({
        clientRunId,
        startedAt: ...,
      });

      // 2. Upload GPS points (idempotent)
      const points = JSON.parse(await AsyncStorage.getItem(`run_${clientRunId}_points`) || '[]');
      await StrideAPI.ingestTrackPoints(runData.run.id, points);

      // 3. Finish run (idempotent)
      const finishData = JSON.parse(await AsyncStorage.getItem(`run_${clientRunId}_finish`) || '{}');
      await StrideAPI.finishRun(runData.run.id, finishData.endedAt);

      // 4. Clean up local data
      await AsyncStorage.multiRemove([
        `run_${clientRunId}`,
        `run_${clientRunId}_serverId`,
        `run_${clientRunId}_points`,
        `run_${clientRunId}_finish`,
      ]);
    } catch (error) {
      console.error(`Failed to sync run ${clientRunId}:`, error);
    }
  }
};
```

## Conflict Resolution

### Server is Authoritative

When there's a conflict between local and server data:

1. **Metrics**: Server recalculates from GPS points
2. **Status**: Server state wins
3. **Timestamps**: Server uses provided timestamps

### GPS Points

- Server deduplicates by `(run_id, sequence)`
- Out-of-order points are accepted
- Invalid points are rejected but stored for debugging

## Error Handling

### Network Errors

```typescript
// Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
```

### Partial Sync

If sync fails midway:
1. Completed steps are not undone (idempotent)
2. Failed steps are retried
3. Local data preserved until full sync succeeds

## Storage Limits

### Local Storage

- GPS points: ~1KB per point
- 1 hour run @ 1 point/second = ~3,600 points = ~3.6MB
- Recommend: Clean up after successful sync

### Server Storage

- GPS points stored indefinitely (for route replay)
- Consider: Archive old runs, compress old GPS data

## Testing Offline

### iOS Simulator
1. Toggle airplane mode
2. Run app, start run, record GPS
3. Toggle airplane mode off
4. Verify sync

### Android Emulator
1. Use extended controls → Cellular
2. Set signal strength to None
3. Run app, start run, record GPS
4. Restore signal
5. Verify sync

### Real Device
1. Run in areas with poor connectivity
2. Start run before entering dead zone
3. Finish run in dead zone
4. Exit dead zone
5. Verify sync
