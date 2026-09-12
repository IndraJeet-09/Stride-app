import { db } from "./index";
import {
  users,
  userSettings,
  runs,
  runTrackPoints,
  runPausePeriods,
  runSplits,
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
      clientRunId: "run-sep12-1",
      status: "completed" as const,
      startedAt: new Date("2026-09-12T06:45:00Z"),
      endedAt: new Date("2026-09-12T07:27:31Z"),
      timezone: "Asia/Kolkata",
      title: "Morning Run",
      distanceMeters: 8420,
      durationSeconds: 2551,
      movingDurationSeconds: 2551,
      averagePaceSecondsPerKm: 303,
      averageSpeedMps: 3.3,
      maxSpeedMps: 4.2,
      calories: 606,
      elevationGainMeters: 84,
      elevationLossMeters: 78,
      startLatitude: 12.9716,
      startLongitude: 77.5946,
      endLatitude: 12.9716,
      endLongitude: 77.5946,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      clientRunId: "run-sep11-1",
      status: "completed" as const,
      startedAt: new Date("2026-09-11T17:30:00Z"),
      endedAt: new Date("2026-09-11T18:15:00Z"),
      timezone: "Asia/Kolkata",
      title: "Evening Run",
      distanceMeters: 5200,
      durationSeconds: 2700,
      movingDurationSeconds: 2700,
      averagePaceSecondsPerKm: 319,
      averageSpeedMps: 3.1,
      maxSpeedMps: 3.8,
      calories: 374,
      elevationGainMeters: 45,
      elevationLossMeters: 42,
      startLatitude: 12.9716,
      startLongitude: 77.5946,
      endLatitude: 12.9716,
      endLongitude: 77.5946,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      clientRunId: "run-sep10-1",
      status: "completed" as const,
      startedAt: new Date("2026-09-10T06:00:00Z"),
      endedAt: new Date("2026-09-10T07:30:00Z"),
      timezone: "Asia/Kolkata",
      title: "Long Run",
      distanceMeters: 12800,
      durationSeconds: 5400,
      movingDurationSeconds: 5400,
      averagePaceSecondsPerKm: 253,
      averageSpeedMps: 3.9,
      maxSpeedMps: 4.5,
      calories: 921,
      elevationGainMeters: 120,
      elevationLossMeters: 115,
      startLatitude: 12.9716,
      startLongitude: 77.5946,
      endLatitude: 12.9716,
      endLongitude: 77.5946,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      clientRunId: "run-sep9-1",
      status: "completed" as const,
      startedAt: new Date("2026-09-09T06:30:00Z"),
      endedAt: new Date("2026-09-09T07:15:00Z"),
      timezone: "Asia/Kolkata",
      title: "Tempo Run",
      distanceMeters: 6500,
      durationSeconds: 2700,
      movingDurationSeconds: 2700,
      averagePaceSecondsPerKm: 250,
      averageSpeedMps: 4.0,
      maxSpeedMps: 4.8,
      calories: 468,
      elevationGainMeters: 55,
      elevationLossMeters: 50,
      startLatitude: 12.9716,
      startLongitude: 77.5946,
      endLatitude: 12.9716,
      endLongitude: 77.5946,
      visibility: "private" as const,
    },
    {
      id: `run_${nanoid()}`,
      clientRunId: "run-sep8-1",
      status: "completed" as const,
      startedAt: new Date("2026-09-08T18:00:00Z"),
      endedAt: new Date("2026-09-08T18:45:00Z"),
      timezone: "Asia/Kolkata",
      title: "Recovery Run",
      distanceMeters: 3200,
      durationSeconds: 2700,
      movingDurationSeconds: 2700,
      averagePaceSecondsPerKm: 328,
      averageSpeedMps: 3.0,
      maxSpeedMps: 3.5,
      calories: 230,
      elevationGainMeters: 25,
      elevationLossMeters: 22,
      startLatitude: 12.9716,
      startLongitude: 77.5946,
      endLatitude: 12.9716,
      endLongitude: 77.5946,
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
