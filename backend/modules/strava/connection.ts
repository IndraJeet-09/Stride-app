import { db } from "@/db";
import { stravaConnections, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptToken, decryptToken } from "@/lib/crypto";
import { nanoid } from "nanoid";
import type { StravaConnectionInfo } from "./types";

/**
 * Store a new Strava connection (or update existing disconnected one).
 */
export async function saveStravaConnection(params: {
  userId: string;
  stravaAthleteId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  grantedScopes: string;
}): Promise<void> {
  const { userId, stravaAthleteId, accessToken, refreshToken, expiresAt, grantedScopes } = params;

  // Check for existing connection
  const existing = await db.query.stravaConnections.findFirst({
    where: eq(stravaConnections.userId, userId),
  });

  if (existing) {
    // Update existing connection
    await db
      .update(stravaConnections)
      .set({
        stravaAthleteId,
        accessTokenEncrypted: encryptToken(accessToken),
        refreshTokenEncrypted: encryptToken(refreshToken),
        tokenExpiresAt: new Date(expiresAt * 1000),
        grantedScopes,
        syncStatus: "idle",
        lastSyncError: null,
        connectedAt: new Date(),
        updatedAt: new Date(),
        disconnectedAt: null,
      })
      .where(eq(stravaConnections.id, existing.id));
  } else {
    // Create new connection
    await db.insert(stravaConnections).values({
      id: `strc_${nanoid()}`,
      userId,
      stravaAthleteId,
      accessTokenEncrypted: encryptToken(accessToken),
      refreshTokenEncrypted: encryptToken(refreshToken),
      tokenExpiresAt: new Date(expiresAt * 1000),
      grantedScopes,
      syncStatus: "idle",
    });
  }
}

/**
 * Get the Strava connection for a user.
 */
export async function getStravaConnection(userId: string) {
  const connection = await db.query.stravaConnections.findFirst({
    where: eq(stravaConnections.userId, userId),
  });

  if (!connection || connection.disconnectedAt) {
    return null;
  }

  return connection;
}

/**
 * Get safe connection info (no tokens) for API responses.
 * Includes athlete profile data from the users table.
 */
export async function getConnectionInfo(
  userId: string
): Promise<StravaConnectionInfo> {
  const connection = await getStravaConnection(userId);

  if (!connection) {
    return { connected: false, athlete: null, lastSyncedAt: null, syncStatus: "idle" };
  }

  // Fetch user profile data (avatar, name) that was synced from Strava
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return {
    connected: true,
    athlete: {
      id: connection.stravaAthleteId,
      firstName: user?.displayName?.split(" ")[0] || null,
      lastName: user?.displayName?.split(" ").slice(1).join(" ") || null,
      profileUrl: user?.avatarUrl || null,
    },
    lastSyncedAt: connection.lastSyncCompletedAt?.toISOString() || null,
    syncStatus: connection.syncStatus,
  };
}

/**
 * Mark a connection as disconnected.
 */
export async function disconnectStrava(userId: string): Promise<void> {
  const connection = await getStravaConnection(userId);
  if (!connection) return;

  // Revoke tokens
  try {
    const { revokeToken } = await import("./client");
    const accessToken = decryptToken(connection.accessTokenEncrypted);
    await revokeToken(accessToken);
  } catch {
    // Best effort - even if revocation fails, we mark as disconnected locally
  }

  await db
    .update(stravaConnections)
    .set({
      disconnectedAt: new Date(),
      syncStatus: "idle",
      updatedAt: new Date(),
    })
    .where(eq(stravaConnections.id, connection.id));
}

/**
 * Update sync status for a connection.
 */
export async function updateSyncStatus(
  userId: string,
  status: "idle" | "syncing" | "complete" | "failed" | "reconnect_required",
  error?: string
): Promise<void> {
  const connection = await getStravaConnection(userId);
  if (!connection) return;

  const update: Record<string, unknown> = {
    syncStatus: status,
    updatedAt: new Date(),
  };

  if (status === "syncing") {
    update.lastSyncStartedAt = new Date();
  } else if (status === "complete") {
    update.lastSyncCompletedAt = new Date();
  } else if (status === "failed" && error) {
    update.lastSyncError = error;
  }

  await db
    .update(stravaConnections)
    .set(update)
    .where(eq(stravaConnections.id, connection.id));
}
