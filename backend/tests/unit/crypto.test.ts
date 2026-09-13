import { describe, it, expect, beforeEach } from "vitest";
import { encryptToken, decryptToken } from "@/lib/crypto";

describe("Crypto Token Encryption", () => {
  const originalEnv = process.env.TOKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    // Generate a valid 32-byte hex key for testing
    const crypto = require("crypto");
    process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
  });

  it("should encrypt and decrypt a token correctly", () => {
    const plaintext = "test_access_token_12345";
    const encrypted = encryptToken(plaintext);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for the same plaintext (random IV)", () => {
    const plaintext = "test_token";
    const encrypted1 = encryptToken(plaintext);
    const encrypted2 = encryptToken(plaintext);

    // Different ciphertext due to random IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both decrypt to the same plaintext
    expect(decryptToken(encrypted1)).toBe(plaintext);
    expect(decryptToken(encrypted2)).toBe(plaintext);
  });

  it("should produce ciphertext in the expected format (iv:authTag:encrypted)", () => {
    const plaintext = "test_token";
    const encrypted = encryptToken(plaintext);
    const parts = encrypted.split(":");

    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(32); // 16 bytes hex
    expect(parts[1].length).toBe(32); // 16 bytes hex
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("should throw on invalid encrypted token format", () => {
    expect(() => decryptToken("invalid")).toThrow("Invalid encrypted token format");
    expect(() => decryptToken("a:b")).toThrow("Invalid encrypted token format");
  });

  it("should throw with wrong key", () => {
    const plaintext = "test_token";
    const encrypted = encryptToken(plaintext);

    // Save current key
    const oldKey = process.env.TOKEN_ENCRYPTION_KEY;

    // Set a different key
    const crypto = require("crypto");
    process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");

    expect(() => decryptToken(encrypted)).toThrow();

    // Restore key
    process.env.TOKEN_ENCRYPTION_KEY = oldKey;
  });

  it("should throw if key is wrong length", () => {
    process.env.TOKEN_ENCRYPTION_KEY = "too_short";
    expect(() => encryptToken("test")).toThrow("TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters");
  });

  it("should handle empty string token", () => {
    const encrypted = encryptToken("");
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe("");
  });

  it("should handle long tokens", () => {
    const longToken = "x".repeat(10000);
    const encrypted = encryptToken(longToken);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(longToken);
  });
});
