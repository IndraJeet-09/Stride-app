import { describe, it, expect, beforeEach } from "vitest";
import { generateOAuthState, validateOAuthState } from "@/lib/oauth-state";

describe("OAuth State", () => {
  const originalEnv = process.env.STRAVA_CLIENT_SECRET;

  beforeEach(() => {
    process.env.STRAVA_CLIENT_SECRET = "test_secret_key_for_hmac_signing_123";
  });

  it("should generate a valid state string", () => {
    const state = generateOAuthState("usr_123");
    expect(typeof state).toBe("string");
    expect(state.length).toBeGreaterThan(0);
  });

  it("should validate a freshly generated state", () => {
    const userId = "usr_abc123";
    const state = generateOAuthState(userId);
    const validatedUserId = validateOAuthState(state);
    expect(validatedUserId).toBe(userId);
  });

  it("should reject an expired state", () => {
    // Create a state with an old timestamp
    const timestamp = Date.now() - 11 * 60 * 1000; // 11 minutes ago
    const random = "a".repeat(32);
    const payload = `usr_old:${timestamp}:${random}`;

    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", process.env.STRAVA_CLIENT_SECRET);
    hmac.update(payload);
    const signature = hmac.digest("hex").slice(0, 16);

    const state = Buffer.from(`${payload}:${signature}`).toString("base64url");

    const result = validateOAuthState(state);
    expect(result).toBeNull();
  });

  it("should reject a tampered state", () => {
    const state = generateOAuthState("usr_123");
    // Tamper with the state by changing a character
    const tampered = state.slice(0, -4) + "XXXX";
    const result = validateOAuthState(tampered);
    expect(result).toBeNull();
  });

  it("should reject an invalid base64 state", () => {
    const result = validateOAuthState("not_valid_base64!@#$%");
    expect(result).toBeNull();
  });

  it("should reject a state with wrong number of parts", () => {
    const encoded = Buffer.from("usr_123:1234567890").toString("base64url");
    const result = validateOAuthState(encoded);
    expect(result).toBeNull();
  });

  it("should generate unique states for different users", () => {
    const state1 = generateOAuthState("usr_1");
    const state2 = generateOAuthState("usr_2");
    expect(state1).not.toBe(state2);
  });

  it("should generate unique states for the same user", () => {
    const state1 = generateOAuthState("usr_1");
    const state2 = generateOAuthState("usr_1");
    expect(state1).not.toBe(state2);
  });
});
