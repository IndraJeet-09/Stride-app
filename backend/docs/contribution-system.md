# Contribution System

## Overview

The contribution system is Stride's core feature - a GitHub-style yearly contribution graph showing running activity.

## Concepts

### Contribution Day

Each day in the year has:
- `date`: YYYY-MM-DD
- `runCount`: Number of completed runs
- `distanceMeters`: Total distance in meters
- `level`: Intensity level (0-4)

### Intensity Levels

| Level | Distance | Description |
|-------|----------|-------------|
| 0 | 0 km | No activity |
| 1 | > 0 and < 3 km | Low |
| 2 | ≥ 3 and < 6 km | Moderate |
| 3 | ≥ 6 and < 10 km | High |
| 4 | ≥ 10 km | Very high |

**Note**: Thresholds are configurable in `lib/geo.ts`.

## Data Flow

```
Run Completed
    ↓
Calculate Metrics
    ↓
Update daily_activities
    ↓
Contribution Level Calculated
    ↓
Contribution Graph Updated
```

## Implementation

### Contribution Level Calculation

```typescript
// lib/geo.ts
export function calculateContributionLevel(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000;

  if (distanceKm === 0) return 0;
  if (distanceKm < 3) return 1;
  if (distanceKm < 6) return 2;
  if (distanceKm < 10) return 3;
  return 4;
}
```

### Daily Activity Update

When a run finishes, the system:

1. Calculates activity date in user's timezone
2. Aggregates all runs for that date
3. Updates `daily_activities` table

```typescript
// modules/metrics/index.ts
async function updateDailyActivity(
  userId: string,
  runDate: Date,
  timezone: string
): Promise<void> {
  // Get activity date in user's timezone
  const activityDate = runDate.toISOString().split("T")[0];

  // Get all completed runs for this date
  const dayRuns = await db.query.runs.findMany({
    where: and(
      eq(runs.userId, userId),
      eq(runs.status, "completed")
    ),
  });

  // Calculate aggregates
  const runCount = dayRuns.length;
  const totalDistanceMeters = dayRuns.reduce(
    (sum, run) => sum + (run.distanceMeters || 0), 0
  );
  const totalDurationSeconds = dayRuns.reduce(
    (sum, run) => sum + (run.movingDurationSeconds || 0), 0
  );

  // Upsert daily activity
  await db.insert(dailyActivities).values({
    id: `da_${nanoid()}`,
    userId,
    activityDate,
    runCount,
    totalDistanceMeters,
    totalDurationSeconds,
  });
}
```

### Yearly Contribution Data

```typescript
// modules/contributions/index.ts
export async function getContributionYear(
  userId: string,
  year: number
): Promise<ContributionYear> {
  // Get all daily activities for the year
  const activities = await db.query.dailyActivities.findMany({
    where: and(
      eq(dailyActivities.userId, userId),
      gte(dailyActivities.activityDate, `${year}-01-01`),
      lte(dailyActivities.activityDate, `${year}-12-31`)
    ),
  });

  // Generate all days of the year
  const days: ContributionDay[] = [];
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  while (startDate <= endDate) {
    const dateStr = startDate.toISOString().split("T")[0];
    const activity = activities.find(a => a.activityDate === dateStr);

    days.push({
      date: dateStr,
      runCount: activity?.runCount || 0,
      distanceMeters: activity?.totalDistanceMeters || 0,
      level: calculateContributionLevel(activity?.totalDistanceMeters || 0),
    });

    startDate.setDate(startDate.getDate() + 1);
  }

  return { year, timezone: "UTC", days };
}
```

## API Response

```json
{
  "data": {
    "year": 2026,
    "timezone": "Asia/Kolkata",
    "days": [
      {
        "date": "2026-01-01",
        "runCount": 0,
        "distanceMeters": 0,
        "level": 0
      },
      {
        "date": "2026-09-12",
        "runCount": 1,
        "distanceMeters": 8420,
        "level": 3
      }
    ]
  }
}
```

## Timezone Handling

**Critical**: Contribution dates must use the user's timezone, not UTC.

Example:
- Run at 2026-09-12T23:30:00-05:00 → Date: 2026-09-12
- Run at 2026-09-13T00:30:00-05:00 → Date: 2026-09-13

These are different local dates despite being 1 hour apart.

**Current implementation**: Uses UTC date (simplified). 
**Production**: Use `date-fns-tz` to convert to user's timezone.

## Rebuilding Contributions

If the algorithm changes, rebuild from runs:

```typescript
async function rebuildUserContributions(userId: string): Promise<void> {
  // Get all completed runs
  const runs = await db.query.runs.findMany({
    where: and(
      eq(runs.userId, userId),
      eq(runs.status, "completed")
    ),
  });

  // Group by date
  const runsByDate = new Map<string, typeof runs>();
  for (const run of runs) {
    const date = run.startedAt.toISOString().split("T")[0];
    const existing = runsByDate.get(date) || [];
    existing.push(run);
    runsByDate.set(date, existing);
  }

  // Rebuild daily activities
  for (const [date, dayRuns] of runsByDate) {
    const totalDistance = dayRuns.reduce((sum, r) => sum + (r.distanceMeters || 0), 0);
    const totalDuration = dayRuns.reduce((sum, r) => sum + (r.movingDurationSeconds || 0), 0);

    await db.insert(dailyActivities).values({
      id: `da_${nanoid()}`,
      userId,
      activityDate: date,
      runCount: dayRuns.length,
      totalDistanceMeters: totalDistance,
      totalDurationSeconds: totalDuration,
    });
  }
}
```

## Frontend Rendering

The contribution graph expects:
- 7 rows (Sunday to Saturday or Monday to Sunday)
- 52-53 columns (weeks)
- Month labels at week boundaries
- Weekday labels (M, T, W, T, F, S, S)

The backend provides flat array of days; frontend handles geometry.

## Future Enhancements

1. **Percentile-based intensity**: Use user's historical data
2. **Weekly/monthly aggregations**: Pre-computed for faster queries
3. **Year-over-year comparison**: Compare same period across years
4. **Contribution streaks**: consecutive active days
5. **Personal records**: Best days highlighted
