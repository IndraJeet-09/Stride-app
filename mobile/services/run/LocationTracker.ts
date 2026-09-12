import * as Location from "expo-location";
import { Platform } from "react-native";
import { GPSPoint } from "./types";

export interface LocationTrackingHandle {
  stop: () => void;
}

export function startLocationTracking(
  onLocation: (point: GPSPoint) => void,
  onError: (error: string) => void
): LocationTrackingHandle {
  let subscription: Location.LocationSubscription | null = null;
  let stopped = false;

  (async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      onError("Location permission not granted");
      return;
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      onError("Location services are disabled");
      return;
    }

    try {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1500,
          distanceInterval: 5,
        },
        (location) => {
          if (stopped) return;
          const point: GPSPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: location.timestamp,
          };
          onLocation(point);
        }
      );
    } catch (err: any) {
      if (!stopped) {
        onError(err.message || "Failed to start GPS tracking");
      }
    }
  })();

  return {
    stop: () => {
      stopped = true;
      if (subscription) {
        try {
          subscription.remove();
        } catch {}
        subscription = null;
      }
    },
  };
}
