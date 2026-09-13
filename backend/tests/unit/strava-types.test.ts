import { describe, it, expect } from "vitest";
import type {
  StravaTokenResponse,
  StravaRefreshResponse,
  StravaSummaryActivity,
  StravaWebhookEvent,
  NormalizedRun,
  StravaConnectionInfo,
} from "@/modules/strava/types";

describe("Strava Types", () => {
  describe("StravaTokenResponse", () => {
    it("should accept a complete token response", () => {
      const data: StravaTokenResponse = {
        token_type: "Bearer",
        expires_at: 1234567890,
        expires_in: 3600,
        refresh_token: "refresh_token_123",
        access_token: "access_token_456",
        athlete: {
          id: 12345,
          resource_state: 2,
          firstname: "Test",
          lastname: "User",
          profile_medium: null,
          profile: null,
          city: null,
          state: null,
          country: null,
          sex: null,
          premium: false,
          summit: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        scope: "activity:read_all",
      };

      expect(data.token_type).toBe("Bearer");
      expect(data.athlete.id).toBe(12345);
      expect(data.scope).toBe("activity:read_all");
    });
  });

  describe("StravaRefreshResponse", () => {
    it("should accept a complete refresh response", () => {
      const data: StravaRefreshResponse = {
        token_type: "Bearer",
        expires_at: 1234567890,
        expires_in: 3600,
        refresh_token: "new_refresh_token_123",
        access_token: "new_access_token_456",
      };

      expect(data.token_type).toBe("Bearer");
      expect(data.refresh_token).toBe("new_refresh_token_123");
      // Note: refresh response should NOT have athlete
      expect((data as any).athlete).toBeUndefined();
    });
  });

  describe("StravaSummaryActivity", () => {
    it("should accept a complete activity", () => {
      const data: StravaSummaryActivity = {
        id: 123456789,
        resource_state: 2,
        external_id: "garmin_123",
        upload_id: 98765,
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
      };

      expect(data.id).toBe(123456789);
      expect(data.type).toBe("Run");
      expect(data.sport_type).toBe("Run");
      expect(data.distance).toBe(8420);
      expect(data.moving_time).toBe(2551);
    });
  });

  describe("StravaWebhookEvent", () => {
    it("should accept a create event", () => {
      const data: StravaWebhookEvent = {
        object_type: "activity",
        object_id: 123456,
        aspect_type: "create",
        updates: {},
        owner_id: 789,
        subscription_id: 101112,
        event_time: 1234567890,
      };

      expect(data.object_type).toBe("activity");
      expect(data.aspect_type).toBe("create");
    });

    it("should accept an athlete event", () => {
      const data: StravaWebhookEvent = {
        object_type: "athlete",
        object_id: 12345,
        aspect_type: "update",
        updates: { authorized: "false" },
        owner_id: 12345,
        subscription_id: 101112,
        event_time: 1234567890,
      };

      expect(data.object_type).toBe("athlete");
      expect(data.updates.authorized).toBe("false");
    });
  });

  describe("NormalizedRun", () => {
    it("should accept a normalized run", () => {
      const data: NormalizedRun = {
        stravaActivityId: "123456789",
        name: "Morning Run",
        activityType: "Run",
        sportType: "Run",
        startedAt: new Date("2026-09-12T06:45:00Z"),
        startedAtLocal: new Date("2026-09-12T08:15:00+02:00"),
        timezone: "(GMT+02:00) Europe/Berlin",
        distanceMeters: 8420,
        movingTimeSeconds: 2551,
        elapsedTimeSeconds: 2600,
        elevationGainMeters: 84,
        averageSpeedMps: 3.3,
        maxSpeedMps: 4.2,
        averagePaceSecondsPerKm: 303,
        averageHeartrate: 155.2,
        maxHeartrate: 178,
        calories: 606,
        trainer: false,
        commute: false,
        private: false,
        stravaUrl: "https://www.strava.com/activities/123456789",
      };

      expect(data.stravaActivityId).toBe("123456789");
      expect(data.activityType).toBe("Run");
      expect(data.stravaUrl).toContain("strava.com");
    });
  });

  describe("StravaConnectionInfo", () => {
    it("should accept connected status", () => {
      const data: StravaConnectionInfo = {
        connected: true,
        athlete: {
          id: "12345",
          firstName: "Test",
          lastName: "User",
          profileUrl: "https://example.com/profile.jpg",
        },
        lastSyncedAt: "2026-09-12T10:30:00Z",
        syncStatus: "complete",
      };

      expect(data.connected).toBe(true);
      expect(data.athlete?.firstName).toBe("Test");
      expect(data.syncStatus).toBe("complete");
    });

    it("should accept disconnected status", () => {
      const data: StravaConnectionInfo = {
        connected: false,
        athlete: null,
        lastSyncedAt: null,
        syncStatus: "idle",
      };

      expect(data.connected).toBe(false);
      expect(data.athlete).toBeNull();
    });
  });
});
