import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to reset the module cache between tests since config is cached
describe("Strava Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      STRAVA_CLIENT_ID: "12345",
      STRAVA_CLIENT_SECRET: "test_secret_67890",
      STRAVA_WEBHOOK_VERIFY_TOKEN: "webhook_token_def",
      STRAVA_REDIRECT_URI: "https://api.stride.app/api/v1/integrations/strava/callback",
    };
    // Clear module cache to reset the singleton config
    vi.resetModules();
  });

  it("should return config with all required fields", async () => {
    const { getStravaConfig } = await import("@/modules/strava/config");
    const config = getStravaConfig();
    expect(config.clientId).toBe("12345");
    expect(config.clientSecret).toBe("test_secret_67890");
    expect(config.webhookVerifyToken).toBe("webhook_token_def");
    expect(config.redirectUri).toContain("stride.app");
  });

  it("should have apiBaseUrl default", async () => {
    const { getStravaConfig } = await import("@/modules/strava/config");
    const config = getStravaConfig();
    expect(config.apiBaseUrl).toBe("https://www.strava.com");
  });

  it("should use custom apiBaseUrl when set", async () => {
    process.env.STRAVA_API_BASE_URL = "https://custom.api.com";
    const { getStravaConfig } = await import("@/modules/strava/config");
    const config = getStravaConfig();
    expect(config.apiBaseUrl).toBe("https://custom.api.com");
  });

  it("should return correct API URL for production", async () => {
    const { getStravaApiUrl } = await import("@/modules/strava/config");
    const url = getStravaApiUrl();
    expect(url).toBe("https://www.strava.com/api/v3");
  });

  it("should include activity:read_all scope", async () => {
    const { STRAVA_SCOPES } = await import("@/modules/strava/config");
    expect(STRAVA_SCOPES).toContain("activity:read_all");
  });

  it("should have TOKEN_EXPIRY_BUFFER_SECONDS set", async () => {
    const { TOKEN_EXPIRY_BUFFER_SECONDS } = await import("@/modules/strava/config");
    expect(TOKEN_EXPIRY_BUFFER_SECONDS).toBe(300);
  });
});
