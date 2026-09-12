import { db } from "@/db";
import { users, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logAuthEvent } from "@/lib/logging";

export interface AuthUser {
  sub: string;
  email?: string;
}

export interface ProvisionedUser {
  id: string;
  auth0UserId: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  timezone: string;
  unitSystem: "metric" | "imperial";
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get or create user from Auth0 token (idempotent)
export async function getOrCreateUser(authUser: AuthUser): Promise<ProvisionedUser> {
  // Look up existing user by auth0_user_id
  const existingUser = await db.query.users.findFirst({
    where: eq(users.auth0UserId, authUser.sub),
  });

  if (existingUser) {
    logAuthEvent("user_found", {
      userId: existingUser.id,
      auth0UserId: authUser.sub,
    });
    return existingUser;
  }

  // Create new user — handle race condition with try/catch
  const userId = `usr_${nanoid()}`;
  const newUserData = {
    id: userId,
    auth0UserId: authUser.sub,
    email: authUser.email || null,
    username: null,
    displayName: null,
    avatarUrl: null,
    bio: null,
    timezone: "UTC",
    unitSystem: "metric" as const,
    isPublic: true,
  };

  try {
    await db.insert(users).values(newUserData);

    await db.insert(userSettings).values({
      userId,
      distanceUnit: "km",
      paceUnit: "min/km",
      weekStartsOn: "MON",
      defaultRunVisibility: "private",
      notificationsEnabled: true,
    });

    logAuthEvent("user_provisioned", {
      userId,
      auth0UserId: authUser.sub,
    });
  } catch (error: any) {
    // Race condition: another request created the user first
    if (error?.code === "23505") {
      const raceUser = await db.query.users.findFirst({
        where: eq(users.auth0UserId, authUser.sub),
      });
      if (raceUser) {
        logAuthEvent("user_found", {
          userId: raceUser.id,
          auth0UserId: authUser.sub,
        });
        return raceUser;
      }
    }
    throw error;
  }

  const createdUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!createdUser) {
    throw new Error("Failed to create user");
  }

  return createdUser;
}

// Get user by ID
export async function getUserById(userId: string): Promise<ProvisionedUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return user ?? null;
}

// Get user by username
export async function getUserByUsername(username: string): Promise<ProvisionedUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  return user ?? null;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    timezone?: string;
    unitSystem?: "metric" | "imperial";
    isPublic?: boolean;
  }
): Promise<ProvisionedUser | null> {
  await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return getUserById(userId);
}
