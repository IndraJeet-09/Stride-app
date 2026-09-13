import { getValidToken } from "./token-service";
import { getStravaApiUrl, getStravaConfig } from "./config";
import type { StravaAthlete, StravaSummaryActivity } from "./types";

export class StravaApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = "StravaApiError";
  }
}

async function stravaFetch<T>(
  path: string,
  userId: string,
  options: RequestInit = {}
): Promise<T> {
  const tokenData = await getValidToken(userId);
  if (!tokenData) {
    throw new StravaApiError(401, "No active Strava connection");
  }

  const apiUrl = getStravaApiUrl();
  const url = `${apiUrl}${path}`;
  const headers = {
    Authorization: `Bearer ${tokenData.accessToken}`,
    Accept: "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new StravaApiError(
      429,
      `Rate limited. Retry after ${retryAfter || "60"} seconds`
    );
  }

  // Handle auth failures
  if (response.status === 401) {
    throw new StravaApiError(401, "Strava access token is invalid or revoked");
  }

  if (response.status === 403) {
    throw new StravaApiError(403, "Insufficient Strava permissions");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new StravaApiError(
      response.status,
      `Strava API error (${response.status}): ${body}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Get the authenticated athlete's profile from Strava.
 */
export async function getAthlete(userId: string): Promise<StravaAthlete> {
  return stravaFetch<StravaAthlete>("/athlete", userId);
}

/**
 * Get activities from Strava with pagination.
 * Returns all activities matching the filters.
 */
export async function getActivities(
  userId: string,
  options: {
    before?: number;
    after?: number;
    page?: number;
    perPage?: number;
  } = {}
): Promise<StravaSummaryActivity[]> {
  const params = new URLSearchParams();
  if (options.before) params.set("before", String(options.before));
  if (options.after) params.set("after", String(options.after));
  params.set("page", String(options.page || 1));
  params.set("per_page", String(options.perPage || 30));

  return stravaFetch<StravaSummaryActivity[]>(
    `/athlete/activities?${params.toString()}`,
    userId
  );
}

/**
 * Fetch ALL activities from Strava by paginating through all pages.
 * Respects rate limits and stops when no more pages.
 * Has a hard upper bound of 100 pages (10,000 activities at per_page=100).
 */
export async function getAllActivities(
  userId: string,
  options: {
    before?: number;
    after?: number;
    perPage?: number;
    onProgress?: (fetched: number) => void;
  } = {}
): Promise<StravaSummaryActivity[]> {
  const allActivities: StravaSummaryActivity[] = [];
  let page = 1;
  const perPage = options.perPage || 100; // Max allowed by Strava
  const maxPages = 100; // Safety limit: 100 pages * 100 per_page = 10,000 activities

  while (page <= maxPages) {
    const activities = await getActivities(userId, {
      before: options.before,
      after: options.after,
      page,
      perPage,
    });

    if (activities.length === 0) break;

    allActivities.push(...activities);
    options.onProgress?.(allActivities.length);

    // If we got fewer than perPage, we've reached the end
    if (activities.length < perPage) break;

    page++;

    // Delay between pages to respect rate limits
    // Strava allows ~100 non-upload requests per 15 min
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return allActivities;
}

/**
 * Revoke/deauthorize a Strava access or refresh token.
 * Uses the newer /oauth/revoke endpoint with Basic auth.
 */
export async function revokeToken(token: string): Promise<boolean> {
  const config = getStravaConfig();
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${config.apiBaseUrl}/oauth/revoke`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ token }),
    }
  );

  return response.ok;
}
