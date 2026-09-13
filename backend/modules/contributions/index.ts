import { db } from "@/db";
import { dailyActivities, runs } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
function calculateContributionLevel(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000;
  if (distanceKm === 0) return 0;
  if (distanceKm < 3) return 1;
  if (distanceKm < 6) return 2;
  if (distanceKm < 10) return 3;
  return 4;
}

export interface ContributionDay {
  date: string;
  runCount: number;
  distanceMeters: number;
  level: number;
}

export interface ContributionYear {
  year: number;
  timezone: string;
  days: ContributionDay[];
}

// Get contribution data for a year
export async function getContributionYear(
  userId: string,
  year: number
): Promise<ContributionYear> {
  // Get all daily activities for the year
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const activities = await db.query.dailyActivities.findMany({
    where: and(
      eq(dailyActivities.userId, userId),
      gte(dailyActivities.activityDate, startDate),
      lte(dailyActivities.activityDate, endDate)
    ),
  });

  // Create a map of dates to activities
  const activityMap = new Map<string, typeof activities[0]>();
  for (const activity of activities) {
    activityMap.set(activity.activityDate, activity);
  }

  // Generate all days of the year
  const days: ContributionDay[] = [];
  const currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);

  while (currentDate <= endDateTime) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const activity = activityMap.get(dateStr);

    days.push({
      date: dateStr,
      runCount: activity?.runCount || 0,
      distanceMeters: activity?.totalDistanceMeters || 0,
      level: calculateContributionLevel(activity?.totalDistanceMeters || 0),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    year,
    timezone: "UTC", // In production, get from user settings
    days,
  };
}

// Get contribution summary for dashboard
export async function getContributionSummary(
  userId: string,
  year: number
): Promise<{
  totalRuns: number;
  totalDistanceMeters: number;
  activeDays: number;
  maxStreak: number;
  currentStreak: number;
}> {
  const contribution = await getContributionYear(userId, year);

  const totalRuns = contribution.days.reduce((sum, day) => sum + day.runCount, 0);
  const totalDistanceMeters = contribution.days.reduce(
    (sum, day) => sum + day.distanceMeters,
    0
  );
  const activeDays = contribution.days.filter((day) => day.runCount > 0).length;

  // Calculate streaks
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  // Iterate from today backwards
  const today = new Date().toISOString().split("T")[0];
  const todayIndex = contribution.days.findIndex((day) => day.date === today);

  // Calculate current streak (from today backwards)
  for (let i = todayIndex; i >= 0; i--) {
    if (contribution.days[i].runCount > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate max streak
  for (const day of contribution.days) {
    if (day.runCount > 0) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    totalRuns,
    totalDistanceMeters,
    activeDays,
    maxStreak,
    currentStreak,
  };
}
