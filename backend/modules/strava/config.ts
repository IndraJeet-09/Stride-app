import { z } from "zod";

const stravaConfigSchema = z.object({
  clientId: z.string().min(1, "STRAVA_CLIENT_ID is required"),
  clientSecret: z.string().min(1, "STRAVA_CLIENT_SECRET is required"),
  redirectUri: z.string().url("STRAVA_REDIRECT_URI must be a valid URL"),
  webhookVerifyToken: z.string().min(1, "STRAVA_WEBHOOK_VERIFY_TOKEN is required"),
  apiBaseUrl: z.string().default("https://www.strava.com"),
});

export type StravaConfig = z.infer<typeof stravaConfigSchema>;

let _config: StravaConfig | null = null;

export function getStravaConfig(): StravaConfig {
  if (_config) return _config;

  const result = stravaConfigSchema.safeParse({
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    redirectUri: process.env.STRAVA_REDIRECT_URI,
    webhookVerifyToken: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN,
    apiBaseUrl: process.env.STRAVA_API_BASE_URL || "https://www.strava.com",
  });

  if (!result.success) {
    throw new Error(
      `Strava config error: ${result.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  _config = result.data;
  return _config;
}

/**
 * Get the Strava API base URL from config.
 * This respects the apiBaseUrl setting for sandbox/test environments.
 */
export function getStravaApiUrl(): string {
  const config = getStravaConfig();
  return `${config.apiBaseUrl}/api/v3`;
}

export const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_API_BASE = "https://www.strava.com";

// OAuth scopes - minimum required for MVP
export const STRAVA_SCOPES = ["activity:read_all", "read"] as const;

// Token expiration buffer (refresh 5 minutes before expiry)
export const TOKEN_EXPIRY_BUFFER_SECONDS = 300;

// Activity types that count as "runs" in Stride
export const STRIDE_RUN_TYPES = new Set([
  "Run",
  "TrailRun",
  "VirtualRun",
]);

// Activity sport types that count as runs
export const STRIDE_RUN_SPORT_TYPES = new Set([
  "Run",
  "TrailRun",
  "VirtualRun",
]);
