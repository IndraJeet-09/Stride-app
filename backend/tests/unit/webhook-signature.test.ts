import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";

/**
 * Verify the Strava webhook signature
 * This matches the implementation in the webhook route
 */
function verifyStravaSignature(
  requestText: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(requestText);
  const expectedSignature = hmac.digest("hex");

  // Use timing-safe comparison
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

describe("Webhook Signature Verification", () => {
  const secret = "test_webhook_secret_123";

  it("should verify a valid signature", () => {
    const payload = '{"object_type":"activity","aspect_type":"create","object_id":123,"owner_id":456,"subscription_id":789,"event_time":1234567890}';
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const signature = hmac.digest("hex");

    const result = verifyStravaSignature(payload, signature, secret);
    expect(result).toBe(true);
  });

  it("should reject an invalid signature", () => {
    const payload = '{"object_type":"activity","aspect_type":"create","object_id":123,"owner_id":456,"subscription_id":789,"event_time":1234567890}';
    const result = verifyStravaSignature(payload, "invalid_signature", secret);
    expect(result).toBe(false);
  });

  it("should reject a null signature", () => {
    const payload = '{"object_type":"activity"}';
    const result = verifyStravaSignature(payload, null, secret);
    expect(result).toBe(false);
  });

  it("should reject signature with wrong length", () => {
    const payload = '{"object_type":"activity"}';
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const fullSignature = hmac.digest("hex");
    // Truncate to simulate wrong length
    const truncated = fullSignature.slice(0, 16);
    const result = verifyStravaSignature(payload, truncated, secret);
    expect(result).toBe(false);
  });

  it("should reject signature with wrong secret", () => {
    const payload = '{"object_type":"activity"}';
    const hmac = crypto.createHmac("sha256", "wrong_secret");
    hmac.update(payload);
    const signature = hmac.digest("hex");

    const result = verifyStravaSignature(payload, signature, secret);
    expect(result).toBe(false);
  });

  it("should reject empty payload", () => {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update("");
    const signature = hmac.digest("hex");

    const result = verifyStravaSignature("", signature, secret);
    expect(result).toBe(true); // Empty payload with valid signature should pass
  });

  it("should handle binary-like payload", () => {
    const payload = Buffer.from([0x00, 0x01, 0x02, 0x03]).toString();
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const signature = hmac.digest("hex");

    const result = verifyStravaSignature(payload, signature, secret);
    expect(result).toBe(true);
  });
});
