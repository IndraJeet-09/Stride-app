import { describe, it, expect, beforeEach } from "vitest";
import { encryptToken } from "@/lib/crypto";

describe("Token Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STRAVA_CLIENT_ID: "12345",
      STRAVA_CLIENT_SECRET: "test_secret_67890",
      STRAVA_CLIENT_CONNECT_SECRET: "connect_secret",
      TOKEN_ENCRYPTION_KEY: "a".repeat(64),
    };
  });

  describe("Token Encryption Integration", () => {
    it("should encrypt and decrypt refresh token", () => {
      const refreshToken = "test_refresh_token_12345";
      const encrypted = encryptToken(refreshToken);
      
      expect(encrypted).not.toBe(refreshToken);
      expect(encrypted.split(":").length).toBe(3); // iv:authTag:ciphertext
    });

    it("should handle empty refresh token", () => {
      const encrypted = encryptToken("");
      expect(encrypted).toBeDefined();
    });

    it("should produce different ciphertext each time (random IV)", () => {
      const token = "test_token";
      const encrypted1 = encryptToken(token);
      const encrypted2 = encryptToken(token);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
