import crypto from "crypto";

/**
 * Generate a secure OAuth state parameter.
 * State is: base64url(userId:timestamp:random)
 * Signed with HMAC to prevent tampering.
 */
export function generateOAuthState(userId: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString("hex");
  const payload = `${userId}:${timestamp}:${random}`;

  const hmac = crypto.createHmac("sha256", process.env.STRAVA_CLIENT_SECRET || "");
  hmac.update(payload);
  const signature = hmac.digest("hex").slice(0, 16);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

/**
 * Validate and decode an OAuth state parameter.
 * Returns the userId if valid, null otherwise.
 */
export function validateOAuthState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;

    const [userId, timestamp, random, signature] = parts;

    // Verify signature using timing-safe comparison
    const payload = `${userId}:${timestamp}:${random}`;
    const hmac = crypto.createHmac("sha256", process.env.STRAVA_CLIENT_SECRET || "");
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex").slice(0, 16);

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedSigBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedSigBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) return null;

    // Verify not expired (10 minutes)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 10 * 60 * 1000) return null;

    return userId;
  } catch {
    return null;
  }
}
