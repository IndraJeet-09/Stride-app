import { db } from "@/db";
import { users, runs, dailyActivities } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { calculateStreaks } from "@/modules/streaks";
import { getUserStats } from "@/modules/statistics";

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  stats: {
    totalRuns: number;
    totalDistanceMeters: number;
    currentStreak: number;
    longestStreak: number;
  };
  recentRuns: {
    id: string;
    title: string;
    distanceMeters: number;
    startedAt: Date;
  }[];
}

// Get public profile by username
export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  // Get user
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.username, username),
      eq(users.isPublic, true),
      eq(users.deletedAt, null as any)
    ),
  });

  if (!user) {
    return null;
  }

  // Get stats
  const stats = await getUserStats(user.id);

  // Get recent public runs
  const recentRuns = await db.query.runs.findMany({
    where: and(
      eq(runs.userId, user.id),
      eq(runs.status, "completed"),
      eq(runs.visibility, "public")
    ),
    orderBy: desc(runs.startedAt),
    limit: 5,
  });

  return {
    id: user.id,
    username: user.username!,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
    stats: {
      totalRuns: stats.totalRuns,
      totalDistanceMeters: stats.totalDistanceMeters,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    },
    recentRuns: recentRuns.map((run) => ({
      id: run.id,
      title: run.title,
      distanceMeters: run.distanceMeters,
      startedAt: run.startedAt,
    })),
  };
}
