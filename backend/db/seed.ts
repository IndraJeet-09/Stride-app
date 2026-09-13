import { db } from "./index";
import {
  users,
  userSettings,
  runs,
  dailyActivities,
} from "./schema";
import { nanoid } from "nanoid";

async function seed() {
  console.log("Seeding database...");

  // Create test user
  const userId = `usr_${nanoid()}`;
  await db.insert(users).values({
    id: userId,
    auth0UserId: "auth0|test_user_123",
    email: "test@stride.app",
    username: "testrunner",
    displayName: "Test Runner",
    avatarUrl: null,
    bio: "Just a test runner",
    timezone: "Asia/Kolkata",
    unitSystem: "metric",
    isPublic: true,
  });

  // Create user settings
  await db.insert(userSettings).values({
    userId,
    distanceUnit: "km",
    paceUnit: "min/km",
    weekStartsOn: "MON",
    defaultRunVisibility: "private",
    notificationsEnabled: true,
  });

  // Create sample runs across multiple dates
  const runsData = [
    {
      id: `run_${nanoid()}`,
      name: "Morning Run",
      activityType: "Run",
      sportType: "Run",
      startedAt: new Date("2026-09-12T06:45:00Z"),
      startedAtLocal: new Date("2026-09-12T12:15:00+05:30"),
      endedAt: new Date("2026-09-12T07:27:31Z"),
      timezone: "Asia/Kolkata",
      distanceMeters: 8420,
      movingDurationSeconds: 2551,
      elapsedTimeSeconds: 2551,
      averagePaceSecondsPerKm: 303,
      averageSpeedMps: 3.3,
      maxSpeedMps: 4.2,
      calories: 606,
      elevationGainMeters: 84,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      name: "Evening Run",
      activityType: "Run",
      sportType: "Run",
      startedAt: new Date("2026-09-11T17:30:00Z"),
      startedAtLocal: new Date("2026-09-11T23:00:00+05:30"),
      endedAt: new Date("2026-09-11T18:15:00Z"),
      timezone: "Asia/Kolkata",
      distanceMeters: 5200,
      movingDurationSeconds: 2700,
      elapsedTimeSeconds: 2700,
      averagePaceSecondsPerKm: 319,
      averageSpeedMps: 3.1,
      maxSpeedMps: 3.8,
      calories: 374,
      elevationGainMeters: 45,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      name: "Long Run",
      activityType: "Run",
      sportType: "Run",
      startedAt: new Date("2026-09-10T06:00:00Z"),
      startedAtLocal: new Date("2026-09-10T11:30:00+05:30"),
      endedAt: new Date("2026-09-10T07:30:00Z"),
      timezone: "Asia/Kolkata",
      distanceMeters: 12800,
      movingDurationSeconds: 5400,
      elapsedTimeSeconds: 5400,
      averagePaceSecondsPerKm: 253,
      averageSpeedMps: 3.9,
      maxSpeedMps: 4.5,
      calories: 921,
      elevationGainMeters: 120,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      name: "Tempo Run",
      activityType: "Run",
      sportType: "Run",
      startedAt: new Date("2026-09-09T06:30:00Z"),
      startedAtLocal: new Date("2026-09-09T12:00:00+05:30"),
      endedAt: new Date("2026-09-09T07:15:00Z"),
      timezone: "Asia/Kolkata",
      distanceMeters: 6500,
      movingDurationSeconds: 2700,
      elapsedTimeSeconds: 2700,
      averagePaceSecondsPerKm: 250,
      averageSpeedMps: 4.0,
      maxSpeedMps: 4.8,
      calories: 468,
      elevationGainMeters: 55,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      name: "Recovery Run",
      activityType: "Run",
      sportType: "Run",
      startedAt: new Date("2026-09-08T18:00:00Z"),
      startedAtLocal: new Date("2026-09-08T23:30:00+05:30"),
      endedAt: new Date("2026-09-08T18:45:00Z"),
      timezone: "Asia/Kolkata",
      distanceMeters: 3200,
      movingDurationSeconds: 2700,
      elapsedTimeSeconds: 2700,
      averagePaceSecondsPerKm: 328,
      averageSpeedMps: 3.0,
      maxSpeedMps: 3.5,
      calories: 230,
      elevationGainMeters: 25,
      visibility: "private" as const,
    },
  ];

  for (const runData of runsData) {
    await db.insert(runs).values({ ...runData, userId });
  }

  // Create daily activities
  const dates = ["2026-09-12", "2026-09-11", "2026-09-10", "2026-09-09", "2026-09-08"];
  for (const date of dates) {
    await db.insert(dailyActivities).values({
      id: `da_${nanoid()}`,
      userId,
      activityDate: date,
      runCount: 1,
      totalDistanceMeters: 5000 + Math.random() * 8000,
      totalDurationSeconds: 2500 + Math.random() * 3000,
    });
  }

  console.log("Seed complete!");
  console.log(`Created user: ${userId}`);
}

seed().catch(console.error);
