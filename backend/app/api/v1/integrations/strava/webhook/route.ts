import { NextRequest, NextResponse } from "next/server";
import { getStravaConfig } from "@/modules/strava/config";
import { handleActivityEvent } from "@/modules/strava/sync";
import { db } from "@/db";
import { stravaConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createRequestLogger } from "@/lib/logging";
import crypto from "crypto";
import type { StravaWebhookEvent } from "@/modules/strava/types";

/**
 * Verify the Strava webhook signature.
 * Strava signs the request body with the client secret using SHA-256 HMAC.
 */
function verifyStravaSignature(
  body: string,
  signature: string | null,
  clientSecret: string
): boolean {
  if (!signature) return false;
  const expectedSignature = crypto
    .createHmac("sha256", clientSecret)
    .update(body)
    .digest("hex");
  return signature === expectedSignature;
}

/**
 * GET /api/v1/integrations/strava/webhook
 *
 * Strava webhook verification challenge.
 * Strava sends this when creating a subscription.
 * Must respond within 2 seconds with the hub.challenge echoed back.
 */
export async function GET(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const config = getStravaConfig();

  if (mode === "subscribe" && token === config.webhookVerifyToken) {
    logger.info("Webhook verification successful");
    return NextResponse.json({ "hub.challenge": challenge });
  }

  logger.warn({ mode, token }, "Webhook verification failed");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST /api/v1/integrations/strava/webhook
 *
 * Receives webhook events from Strava.
 * Must respond with 200 OK within 2 seconds.
 * Processing should be lightweight; heavy work can be async.
 */
export async function POST(req: NextRequest) {
  const requestId = req.headers.get("X-Request-ID") || "unknown";
  const logger = createRequestLogger(requestId);

  // Read raw body for signature verification
  const rawBody = await req.text();

  // Verify Strava signature
  const config = getStravaConfig();
  const signature = req.headers.get("X-Strava-Signature");

  if (!verifyStravaSignature(rawBody, signature, config.clientSecret)) {
    logger.warn("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    const event: StravaWebhookEvent = JSON.parse(rawBody);

    logger.info(
      {
        objectType: event.object_type,
        aspectType: event.aspect_type,
        objectId: event.object_id,
        ownerId: event.owner_id,
      },
      "Webhook event received"
    );

    // Validate required fields
    if (!event.object_type || !event.aspect_type || !event.object_id || !event.owner_id) {
      logger.warn("Invalid webhook event structure");
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    // Handle athlete deauthorization
    if (
      event.object_type === "athlete" &&
      event.aspect_type === "update" &&
      event.updates.authorized === "false"
    ) {
      logger.info(
        { athleteId: event.owner_id },
        "Athlete deauthorized - marking connection as disconnected"
      );

      // Find and mark the connection
      await db
        .update(stravaConnections)
        .set({
          syncStatus: "reconnect_required",
          disconnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          eq(stravaConnections.stravaAthleteId, String(event.owner_id))
        );

      return NextResponse.json({ ok: true });
    }

    // Handle activity events (create, update, delete)
    if (event.object_type === "activity") {
      // Process asynchronously - we return 200 immediately
      handleActivityEvent(
        event.owner_id,
        event.aspect_type,
        event.object_id,
        event.updates
      ).catch((error) => {
        logger.error(
          { error, objectId: event.object_id },
          "Failed to process activity webhook event"
        );
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Webhook processing error");
    // Still return 200 to prevent Strava from retrying
    return NextResponse.json({ ok: true });
  }
}
