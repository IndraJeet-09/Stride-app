import { db } from "@/db";
import { dailyActivities } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  currentStreakStartDate: string | null;
  lastActiveDate: string | null;
}

// Calculate streak information for a user
export async function calculateStreaks(userId: string): Promise<StreakInfo> {
  // Get all daily activities ordered by date
  const activities = await db.query.dailyActivities.findMany({
    where: eq(dailyActivities.userId, userId),
    orderBy: desc(dailyActivities.activityDate),
  });

  if (activities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStartDate: null,
      lastActiveDate: null,
    };
  }

  // Get unique active dates (days with at least one run)
  const activeDates = activities
    .filter((a) => a.runCount > 0)
    .map((a) => a.activityDate)
    .sort()
    .reverse(); // Most recent first

  if (activeDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStartDate: null,
      lastActiveDate: null,
    };
  }

  const lastActiveDate = activeDates[0];

  // Calculate current streak (from today backwards)
  let currentStreak = 0;
  let currentStreakStartDate: string | null = null;
  const today = new Date().toISOString().split("T")[0];
  
  // Check if today or yesterday is active
  const todayActivity = activities.find((a) => a.activityDate === today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterdayActivity = activities.find((a) => a.activityDate === yesterdayStr);

  // Start from the most recent active date
  let checkDate = new Date(lastActiveDate);
  
  // If today is not active and yesterday is not active, streak is broken
  if (!todayActivity && !yesterdayActivity) {
    currentStreak = 0;
  } else {
    // Count consecutive days
    let consecutiveDays = 0;
    let currentDate = new Date(today);
    
    // If today is not active, start from yesterday
    if (!todayActivity) {
      currentDate = new Date(yesterdayStr);
    }

    while (true) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const activity = activities.find((a) => a.activityDate === dateStr);
      
      if (activity && activity.runCount > 0) {
        consecutiveDays++;
        currentStreakStartDate = dateStr;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    currentStreak = consecutiveDays;
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Sort dates ascending for longest streak calculation
  const sortedDates = [...activeDates].sort();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return {
    currentStreak,
    longestStreak,
    currentStreakStartDate,
    lastActiveDate,
  };
}
