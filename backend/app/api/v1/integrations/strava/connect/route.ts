import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { getOrCreateUser } from "@/modules/auth";
import { getStravaConfig, STRAVA_AUTH_URL, STRAVA_SCOPES } from "@/modules/strava/config";
import { hasActiveConnection } from "@/modules/strava/token-service";
import { handleApiError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging";
import { generateOAuthState } from "@/lib/oauth-state";

// GET /api/v1/integrations/strava/connect
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  try {
    const authUser = await requireAuth(req);
    const user = await getOrCreateUser(authUser);

    // Check if already connected
    const alreadyConnected = await hasActiveConnection(user.id);
    if (alreadyConnected) {
      return NextResponse.json({
        data: {
          connected: true,
          message: "Already connected to Strava",
        },
      });
    }

    // Generate secure state
    const state = generateOAuthState(user.id);

    // Build Strava authorization URL
    const config = getStravaConfig();
    const scopes = STRAVA_SCOPES.join(" ");
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      approval_prompt: "auto",
      scope: scopes,
      state,
    });

    const authUrl = `${STRAVA_AUTH_URL}?${params.toString()}`;

    logger.info({ userId: user.id }, "Strava OAuth initiated");

    return NextResponse.json({
      data: {
        authUrl,
        state,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to initiate Strava connection");
    return handleApiError(error, requestId);
  }
}
