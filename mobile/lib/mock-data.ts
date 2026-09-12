import { RunnerProfile, RunActivity, ContributionDay, RunSplit, RoutePoint, WeeklyActivityItem } from "./types";
import { getDistanceIntensity, calculatePace, formatDuration } from "./utils";
import { format, subDays, addDays, parseISO } from "date-fns";

export const MOCK_RUNNER_PROFILE: RunnerProfile = {
  name: "INDRAJEET",
  username: "indrajeet",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
  bio: "Chasing marathons & building consistency, one square at a time.",
  location: "San Francisco, CA",
  memberSince: "2026",
  totalDistanceKm: 842.6,
  totalRuns: 97,
  currentStreakDays: 12,
  longestStreakDays: 31,
  longestRunKm: 21.4,
  avgPace: "5:24/km",
  totalElevationMeters: 18421,
  prs: {
    fastest5k: "22:45",
    fastest10k: "48:32",
    longestRunKm: 21.4,
    maxElevationM: 420,
  },
  aggregateStats: {
    avgPace: "5:24 /km",
    avgDistanceKm: 8.6,
    totalElevationM: 18421,
  },
};

export const MOCK_PROFILE = MOCK_RUNNER_PROFILE;

export const MOCK_WEEKLY_ACTIVITY: WeeklyActivityItem[] = [
  { day: "M", distance: 8.42, isToday: false },
  { day: "T", distance: 0, isToday: false },
  { day: "W", distance: 5.21, isToday: false },
  { day: "T", distance: 6.74, isToday: false },
  { day: "F", distance: 0, isToday: false },
  { day: "S", distance: 8.42, isToday: true },
  { day: "S", distance: 0, isToday: false },
];

function generateRoutePoints(distanceKm: number, seed: number): RoutePoint[] {
  const points: RoutePoint[] = [];
  const totalPoints = 30 + Math.floor(distanceKm * 4);
  const centerX = 150;
  const centerY = 100;
  const radius = 60 + (seed % 20);

  for (let i = 0; i < totalPoints; i++) {
    const angle = (i / totalPoints) * Math.PI * 2;
    const wobble1 = Math.sin(angle * 3 + seed) * 18;
    const wobble2 = Math.cos(angle * 5 + seed * 2) * 10;
    const x = centerX + Math.cos(angle) * (radius + wobble1);
    const y = centerY + Math.sin(angle) * (radius + wobble2);
    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  return points;
}

function generateSplits(distanceKm: number, basePaceSec: number): RunSplit[] {
  const fullKm = Math.floor(distanceKm);
  const splits: RunSplit[] = [];

  for (let i = 1; i <= fullKm; i++) {
    const variation = Math.sin(i * 1.7) * 14 + (Math.sin(i * 3) * 6);
    const paceSec = Math.max(240, Math.round(basePaceSec + variation));
    const mins = Math.floor(paceSec / 60);
    const secs = paceSec % 60;
    splits.push({
      km: i,
      pace: `${mins}:${secs.toString().padStart(2, "0")}`,
      paceSeconds: paceSec,
      elevationGain: Math.max(2, Math.round(Math.abs(Math.cos(i) * 16))),
    });
  }

  const partial = distanceKm - fullKm;
  if (partial > 0.1) {
    const paceSec = Math.round(basePaceSec);
    const mins = Math.floor(paceSec / 60);
    const secs = paceSec % 60;
    splits.push({
      km: Math.round(distanceKm * 100) / 100,
      pace: `${mins}:${secs.toString().padStart(2, "0")}`,
      paceSeconds: paceSec,
      elevationGain: 4,
    });
  }

  return splits;
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateContributionHistory(targetDateStr = "2026-09-12"): {
  days: ContributionDay[];
  allRuns: RunActivity[];
} {
  const endDate = parseISO(targetDateStr);
  const totalDays = 364; // 52 weeks exactly
  const startDate = subDays(endDate, totalDays - 1);

  const days: ContributionDay[] = [];
  const allRuns: RunActivity[] = [];
  let runCounter = 1;

  for (let i = 0; i < totalDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const formattedDate = format(currentDate, "MMM d, yyyy");
    const dayOfWeek = currentDate.getDay();
    const weekIndex = Math.floor(i / 7);

    if (dateStr === "2026-09-12") {
      const run1: RunActivity = {
        id: "run-sep12-1",
        title: "Morning Run",
        date: dateStr,
        formattedDate: "Sep 12, 2026",
        timeOfDay: "06:45 AM",
        distance: 8.42,
        durationSeconds: 2551,
        durationFormatted: "42:31",
        avgPace: "5:03 /km",
        elevationGain: 84,
        calories: 640,
        category: "Morning Run",
        splits: generateSplits(8.42, 303),
        routePoints: generateRoutePoints(8.42, 912),
      };

      const totalDist = 8.42;
      const intensity = getDistanceIntensity(totalDist);
      allRuns.push(run1);

      days.push({
        date: dateStr,
        formattedDate,
        dayOfWeek,
        weekIndex,
        distance: totalDist,
        runsCount: 1,
        count: 1,
        level: intensity,
        intensity,
        runs: [run1],
      });
      continue;
    }

    if (dateStr === "2026-09-11") {
      days.push({
        date: dateStr,
        formattedDate,
        dayOfWeek,
        weekIndex,
        distance: 0,
        runsCount: 0,
        count: 0,
        level: 0,
        intensity: 0,
        runs: [],
      });
      continue;
    }

    const randVal = pseudoRandom(i * 17 + 42);
    const dayName = format(currentDate, "EEE");

    let isRunDay = false;
    if (i >= totalDays - 13 && i < totalDays - 1) {
      isRunDay = true;
    } else {
      isRunDay = randVal > 0.38;
    }

    if (!isRunDay) {
      days.push({
        date: dateStr,
        formattedDate,
        dayOfWeek,
        weekIndex,
        distance: 0,
        runsCount: 0,
        count: 0,
        level: 0,
        intensity: 0,
        runs: [],
      });
    } else {
      let distance = 5.0;
      let category: RunActivity["category"] = "Morning Run";

      if (dayName === "Sun") {
        distance = Math.round((12 + pseudoRandom(i * 3) * 9.4) * 100) / 100;
        category = "Sunday Long Run";
      } else if (dayName === "Wed") {
        distance = Math.round((6 + pseudoRandom(i * 5) * 4) * 100) / 100;
        category = "Tempo Run";
      } else if (randVal > 0.82) {
        distance = Math.round((4.5 + pseudoRandom(i * 7) * 3) * 100) / 100;
        category = "Interval Workout";
      } else if (randVal < 0.45) {
        distance = Math.round((2.5 + pseudoRandom(i * 11) * 2) * 100) / 100;
        category = randVal < 0.2 ? "Evening Run" : "Morning Run";
      } else {
        distance = Math.round((5 + pseudoRandom(i * 13) * 3.5) * 100) / 100;
        category = "Morning Run";
      }

      const basePaceSec = Math.round(300 + pseudoRandom(i * 9) * 40 - 10);
      const durationSeconds = Math.round(distance * basePaceSec);
      const elevationGain = Math.round(distance * (8 + pseudoRandom(i * 2) * 12));
      const avgPaceStr = calculatePace(distance, durationSeconds);
      const intensity = getDistanceIntensity(distance);

      const run: RunActivity = {
        id: `run-${runCounter++}`,
        title: category,
        date: dateStr,
        formattedDate,
        timeOfDay: category.includes("Evening") ? "06:30 PM" : "07:00 AM",
        distance,
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        avgPace: avgPaceStr,
        elevationGain,
        calories: Math.round(distance * 72),
        category,
        splits: generateSplits(distance, basePaceSec),
        routePoints: generateRoutePoints(distance, i),
      };

      allRuns.push(run);

      days.push({
        date: dateStr,
        formattedDate,
        dayOfWeek,
        weekIndex,
        distance,
        runsCount: 1,
        count: 1,
        level: intensity,
        intensity,
        runs: [run],
      });
    }
  }

  return { days, allRuns };
}

export const MOCK_HISTORY = generateContributionHistory("2026-09-12");

export const RECENT_RUNS_LIST: RunActivity[] = [
  {
    id: "run-sep12-1",
    title: "Morning Run",
    date: "2026-09-12",
    formattedDate: "Sep 12, 2026",
    timeOfDay: "06:45 AM",
    distance: 8.42,
    durationSeconds: 2551,
    durationFormatted: "42:31",
    avgPace: "5:03 /km",
    elevationGain: 84,
    calories: 640,
    category: "Morning Run",
    splits: generateSplits(8.42, 303),
    routePoints: generateRoutePoints(8.42, 912),
  },
  {
    id: "run-sep10-1",
    title: "Evening Run",
    date: "2026-09-10",
    formattedDate: "Sep 10, 2026",
    timeOfDay: "06:14 PM",
    distance: 5.21,
    durationSeconds: 1634,
    durationFormatted: "27:14",
    avgPace: "5:13 /km",
    elevationGain: 38,
    calories: 390,
    category: "Evening Run",
    splits: generateSplits(5.21, 313),
    routePoints: generateRoutePoints(5.21, 910),
  },
  {
    id: "run-sep08-1",
    title: "Morning Run",
    date: "2026-09-08",
    formattedDate: "Sep 08, 2026",
    timeOfDay: "07:15 AM",
    distance: 6.74,
    durationSeconds: 2112,
    durationFormatted: "35:12",
    avgPace: "5:13 /km",
    elevationGain: 62,
    calories: 490,
    category: "Morning Run",
    splits: generateSplits(6.74, 313),
    routePoints: generateRoutePoints(6.74, 908),
  },
];
