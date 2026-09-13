import { NextRequest, NextResponse } from "next/server";
import { validateOAuthState } from "@/lib/oauth-state";
import { saveStravaConnection } from "@/modules/strava/connection";
import { getAthlete } from "@/modules/strava/client";
import { syncActivities } from "@/modules/strava/sync";
import { getStravaConfig, getStravaApiUrl } from "@/modules/strava/config";
import type { StravaTokenResponse } from "@/modules/strava/types";
import { createRequestLogger } from "@/lib/logging";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/v1/integrations/strava/callback
 *
 * Handles the OAuth callback from Strava.
 * - Validates the state parameter
 * - Exchanges the authorization code for tokens
 * - Stores the connection
 * - Fetches athlete profile
 * - Initiates initial activity sync
 * - Redirects back to the mobile app
 */
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Get the mobile app's deep link base
  const appUrl = process.env.APP_URL || "stride://";

  // Handle user denying authorization
  if (error === "access_denied") {
    logger.info("Strava authorization denied by user");
    return NextResponse.redirect(
      `${appUrl}?strava_error=access_denied`
    );
  }

  // Validate state parameter
  if (!state) {
    logger.warn("Missing state parameter in Strava callback");
    return NextResponse.redirect(
      `${appUrl}?strava_error=invalid_state`
    );
  }

  const userId = validateOAuthState(state);
  if (!userId) {
    logger.warn("Invalid or expired state parameter");
    return NextResponse.redirect(
      `${appUrl}?strava_error=invalid_state`
    );
  }

  // Validate authorization code
  if (!code) {
    logger.warn("Missing authorization code in Strava callback");
    return NextResponse.redirect(
      `${appUrl}?strava_error=missing_code`
    );
  }

  try {
    // Exchange authorization code for tokens
    const config = getStravaConfig();
    const tokenResponse = await fetch(`${getStravaApiUrl()}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error(
        { status: tokenResponse.status, error: errorText },
        "Strava token exchange failed"
      );
      return NextResponse.redirect(
        `${appUrl}?strava_error=token_exchange_failed`
      );
    }

    const tokenData: StravaTokenResponse = await tokenResponse.json();

    // Store the connection
    await saveStravaConnection({
      userId,
      stravaAthleteId: String(tokenData.athlete.id),
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
      grantedScopes: tokenData.scope,
    });

    logger.info(
      {
        userId,
        stravaAthleteId: tokenData.athlete.id,
        scopes: tokenData.scope,
      },
      "Strava connection saved"
    );

    // Fetch athlete profile from Strava and update user if needed
    try {
      const athlete = await getAthlete(userId);

      // Update user profile with Strava data
      const updateData: Record<string, unknown> = {};

      if (athlete.firstname || athlete.lastname) {
        const displayName = [athlete.firstname, athlete.lastname]
          .filter(Boolean)
          .join(" ");
        updateData.displayName = displayName;
      }

      if (athlete.profile) {
        updateData.avatarUrl = athlete.profile;
      }

      if (athlete.city || athlete.state || athlete.country) {
        // We could store this in a separate field, but for now we skip
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId));
      }
    } catch (athleteError) {
      // Non-fatal - connection is still valid
      logger.warn(
        { error: athleteError },
        "Failed to fetch Strava athlete profile"
      );
    }

    // Start initial sync in background (non-blocking)
    // We don't await this - it runs in the background
    syncActivities(userId, { incremental: false }).catch((syncError) => {
      logger.error({ error: syncError }, "Background Strava sync failed");
    });

    // Redirect back to mobile app with success
    return NextResponse.redirect(
      `${appUrl}?strava_connected=true`
    );
  } catch (error) {
    logger.error({ error }, "Strava callback processing failed");
    return NextResponse.redirect(
      `${appUrl}?strava_error=callback_failed`
    );
  }
}
