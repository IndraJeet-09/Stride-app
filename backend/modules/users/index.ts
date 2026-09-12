import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface UserSettings {
  userId: string;
  distanceUnit: string;
  paceUnit: string;
  weekStartsOn: string;
  defaultRunVisibility: string;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get user settings
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const result = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  return result ?? null;
}

// Update user settings
export async function updateUserSettings(
  userId: string,
  data: {
    distanceUnit?: string;
    paceUnit?: string;
    weekStartsOn?: string;
    defaultRunVisibility?: string;
    notificationsEnabled?: boolean;
  }
): Promise<UserSettings | null> {
  await db
    .update(userSettings)
    .set({
      ...(data as any),
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));

  return getUserSettings(userId);
}
