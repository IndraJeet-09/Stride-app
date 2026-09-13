import { db } from "@/db";
import { stravaConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptToken } from "@/lib/crypto";
import { getStravaConfig, TOKEN_EXPIRY_BUFFER_SECONDS } from "./config";
import type { StravaRefreshResponse } from "./types";

export interface ValidToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Simple in-memory lock to prevent concurrent refreshes per connection
const refreshLocks = new Map<string, Promise<ValidToken | null>>();

/**
 * Get a valid access token for a user's Strava connection.
 * Refreshes the token if it's expired or near expiry.
 */
export async function getValidToken(userId: string): Promise<ValidToken | null> {
  const connection = await db.query.stravaConnections.findFirst({
    where: eq(stravaConnections.userId, userId),
  });

  if (!connection || connection.disconnectedAt) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(connection.tokenExpiresAt);
  const bufferMs = TOKEN_EXPIRY_BUFFER_SECONDS * 1000;

  // Token is still valid (with buffer)
  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return {
      accessToken: decryptToken(connection.accessTokenEncrypted),
      refreshToken: decryptToken(connection.refreshTokenEncrypted),
      expiresAt,
    };
  }

  // Token needs refresh - use lock to prevent concurrent refreshes
  const existingLock = refreshLocks.get(connection.id);
  if (existingLock) {
    return existingLock;
  }

  const refreshPromise = refreshAccessToken(connection).finally(() => {
    refreshLocks.delete(connection.id);
  });

  refreshLocks.set(connection.id, refreshPromise);
  return refreshPromise;
}

/**
 * Refresh a Strava access token using the refresh token.
 */
async function refreshAccessToken(connection: {
  id: string;
  refreshTokenEncrypted: string;
  userId: string;
}): Promise<ValidToken> {
  const refreshToken = decryptToken(connection.refreshTokenEncrypted);
  const config = getStravaConfig();

  const response = await fetch(`${config.apiBaseUrl}/api/v3/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    // If refresh token is invalid/revoked, mark connection as needing reconnection
    if (response.status === 401 || response.status === 400) {
      await db
        .update(stravaConnections)
        .set({
          syncStatus: "reconnect_required",
          updatedAt: new Date(),
        })
        .where(eq(stravaConnections.id, connection.id));
    }

    throw new Error(`Strava token refresh failed (${response.status}): ${errorText}`);
  }

  const data: StravaRefreshResponse = await response.json();

  // Import encryptToken dynamically to avoid circular dependency
  const { encryptToken } = await import("@/lib/crypto");

  // Persist the new tokens (refresh token may change!)
  await db
    .update(stravaConnections)
    .set({
      accessTokenEncrypted: encryptToken(data.access_token),
      refreshTokenEncrypted: encryptToken(data.refresh_token),
      tokenExpiresAt: new Date(data.expires_at * 1000),
      updatedAt: new Date(),
    })
    .where(eq(stravaConnections.id, connection.id));

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
  };
}

/**
 * Check if a user has an active Strava connection.
 */
export async function hasActiveConnection(userId: string): Promise<boolean> {
  const connection = await db.query.stravaConnections.findFirst({
    where: eq(stravaConnections.userId, userId),
  });

  return !!connection && !connection.disconnectedAt;
}
