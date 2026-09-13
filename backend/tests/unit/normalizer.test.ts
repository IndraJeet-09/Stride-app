import { describe, it, expect } from "vitest";
import { normalizeStravaActivity } from "@/modules/strava/normalizer";
import type { StravaSummaryActivity } from "@/modules/strava/types";

function createMockActivity(overrides: Partial<StravaSummaryActivity> = {}): StravaSummaryActivity {
  return {
    id: 123456789,
    resource_state: 2,
    external_id: null,
    upload_id: null,
    athlete: { id: 12345, resource_state: 1 },
    name: "Morning Run",
    distance: 8420,
    moving_time: 2551,
    elapsed_time: 2600,
    total_elevation_gain: 84,
    type: "Run",
    sport_type: "Run",
    start_date: "2026-09-12T06:45:00Z",
    start_date_local: "2026-09-12T08:15:00+02:00",
    timezone: "(GMT+02:00) Europe/Berlin",
    utc_offset: 7200,
    start_latlng: [52.52, 13.405],
    end_latlng: [52.52, 13.405],
    achievement_count: 0,
    kudos_count: 5,
    comment_count: 0,
    athlete_count: 1,
    photo_count: 0,
    total_photo_count: 0,
    map: { id: "a123", polyline: "encoded_polyline", resource_state: 2 },
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    flagged: false,
    workout_type: null,
    upload_id_str: null,
    average_speed: 3.3,
    max_speed: 4.2,
    has_kudoed: false,
    hide_from_home: false,
    gear_id: null,
    average_heartrate: 155.2,
    max_heartrate: 178,
    calories: 606,
    device_name: "Garmin Forerunner 265",
    elev_high: 120.5,
    elev_low: 45.2,
    ...overrides,
  };
}

describe("Activity Normalizer", () => {
  it("should normalize a basic running activity", () => {
    const activity = createMockActivity();
    const result = normalizeStravaActivity(activity);

    expect(result.stravaActivityId).toBe("123456789");
    expect(result.name).toBe("Morning Run");
    expect(result.activityType).toBe("Run");
    expect(result.sportType).toBe("Run");
    expect(result.distanceMeters).toBe(8420);
    expect(result.movingTimeSeconds).toBe(2551);
    expect(result.elapsedTimeSeconds).toBe(2600);
    expect(result.elevationGainMeters).toBe(84);
    expect(result.averageHeartrate).toBe(155.2);
    expect(result.maxHeartrate).toBe(178);
    expect(result.calories).toBe(606);
    expect(result.trainer).toBe(false);
    expect(result.commute).toBe(false);
    expect(result.private).toBe(false);
  });

  it("should calculate pace correctly from speed", () => {
    const activity = createMockActivity({ average_speed: 3.3 });
    const result = normalizeStravaActivity(activity);
    // pace = 1000 / 3.3 = 303 seconds per km
    expect(result.averagePaceSecondsPerKm).toBe(303);
  });

  it("should handle zero speed gracefully", () => {
    const activity = createMockActivity({ average_speed: 0 });
    const result = normalizeStravaActivity(activity);
    expect(result.averagePaceSecondsPerKm).toBe(0);
  });

  it("should map TrailRun sport type correctly", () => {
    const activity = createMockActivity({ sport_type: "TrailRun" });
    const result = normalizeStravaActivity(activity);
    expect(result.activityType).toBe("Run");
    expect(result.sportType).toBe("TrailRun");
  });

  it("should map VirtualRun sport type correctly", () => {
    const activity = createMockActivity({ sport_type: "VirtualRun" });
    const result = normalizeStravaActivity(activity);
    expect(result.activityType).toBe("Run");
    expect(result.sportType).toBe("VirtualRun");
  });

  it("should handle missing heartrate", () => {
    const activity = createMockActivity({
      average_heartrate: undefined,
      max_heartrate: undefined,
    });
    const result = normalizeStravaActivity(activity);
    expect(result.averageHeartrate).toBeNull();
    expect(result.maxHeartrate).toBeNull();
  });

  it("should handle missing calories", () => {
    const activity = createMockActivity({ calories: undefined });
    const result = normalizeStravaActivity(activity);
    expect(result.calories).toBe(0);
  });

  it("should handle missing name", () => {
    const activity = createMockActivity({ name: undefined as any });
    const result = normalizeStravaActivity(activity);
    expect(result.name).toBe("Untitled Activity");
  });

  it("should set stravaUrl correctly", () => {
    const activity = createMockActivity({ id: 987654321 });
    const result = normalizeStravaActivity(activity);
    expect(result.stravaUrl).toBe("https://www.strava.com/activities/987654321");
  });

  it("should parse dates correctly", () => {
    const activity = createMockActivity({
      start_date: "2026-09-12T06:45:00Z",
      start_date_local: "2026-09-12T08:15:00+02:00",
    });
    const result = normalizeStravaActivity(activity);
    expect(result.startedAt).toBeInstanceOf(Date);
    expect(result.startedAtLocal).toBeInstanceOf(Date);
  });

  it("should handle timezone", () => {
    const activity = createMockActivity({
      timezone: "(GMT+05:30) Asia/Kolkata",
    });
    const result = normalizeStravaActivity(activity);
    expect(result.timezone).toBe("(GMT+05:30) Asia/Kolkata");
  });
});
