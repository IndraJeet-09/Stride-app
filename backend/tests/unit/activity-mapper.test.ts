import { describe, it, expect } from "vitest";
import { isStrideRun, mapActivityType } from "@/modules/strava/activity-mapper";

describe("Activity Mapper", () => {
  describe("isStrideRun", () => {
    it("should return true for Run activities", () => {
      expect(isStrideRun({ type: "Run", sport_type: "Run" })).toBe(true);
    });

    it("should return true for TrailRun activities", () => {
      expect(isStrideRun({ type: "Run", sport_type: "TrailRun" })).toBe(true);
    });

    it("should return true for VirtualRun activities", () => {
      expect(isStrideRun({ type: "Run", sport_type: "VirtualRun" })).toBe(true);
    });

    it("should return true when only type is Run", () => {
      expect(isStrideRun({ type: "Run" })).toBe(true);
    });

    it("should return false for Ride activities", () => {
      expect(isStrideRun({ type: "Ride", sport_type: "Ride" })).toBe(false);
    });

    it("should return false for Swim activities", () => {
      expect(isStrideRun({ type: "Swim", sport_type: "Swim" })).toBe(false);
    });

    it("should return false for Hike activities", () => {
      expect(isStrideRun({ type: "Hike", sport_type: "Hike" })).toBe(false);
    });

    it("should return false for Walk activities", () => {
      expect(isStrideRun({ type: "Walk", sport_type: "Walk" })).toBe(false);
    });

    it("should return false for WeightTraining activities", () => {
      expect(isStrideRun({ type: "WeightTraining", sport_type: "WeightTraining" })).toBe(false);
    });

    it("should return false for Workout activities", () => {
      expect(isStrideRun({ type: "Workout", sport_type: "Workout" })).toBe(false);
    });

    it("should handle MountainBikeRide (Ride type with specific sport)", () => {
      expect(isStrideRun({ type: "Ride", sport_type: "MountainBikeRide" })).toBe(false);
    });

    it("should use sport_type when available", () => {
      expect(isStrideRun({ type: "Ride", sport_type: "Run" })).toBe(true);
    });

    it("should fallback to type when sport_type is not set", () => {
      expect(isStrideRun({ type: "Run" })).toBe(true);
    });
  });

  describe("mapActivityType", () => {
    it("should map Run to normalized Run", () => {
      const result = mapActivityType("Run", "Run");
      expect(result).toEqual({ activityType: "Run", sportType: "Run" });
    });

    it("should map TrailRun to normalized Run", () => {
      const result = mapActivityType("Run", "TrailRun");
      expect(result).toEqual({ activityType: "Run", sportType: "TrailRun" });
    });

    it("should keep Ride type as-is", () => {
      const result = mapActivityType("Ride", "Ride");
      expect(result).toEqual({ activityType: "Ride", sportType: "Ride" });
    });

    it("should keep Swim type as-is", () => {
      const result = mapActivityType("Swim", "Swim");
      expect(result).toEqual({ activityType: "Swim", sportType: "Swim" });
    });

    it("should use type as sportType fallback", () => {
      const result = mapActivityType("Run");
      expect(result).toEqual({ activityType: "Run", sportType: "Run" });
    });
  });
});
