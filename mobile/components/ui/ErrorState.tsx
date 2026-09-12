import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MapPinOff, WifiOff, AlertOctagon } from "lucide-react-native";
import { triggerHaptic } from "@/lib/haptics";

interface ErrorStateProps {
  type?: "location" | "gps" | "save" | "generic";
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export function ErrorState({
  type = "location",
  title,
  message,
  actionText = "TRY AGAIN",
  onAction,
}: ErrorStateProps) {
  const getDetails = () => {
    switch (type) {
      case "location":
        return {
          icon: MapPinOff,
          title: title ?? "LOCATION ACCESS NEEDED",
          message:
            message ??
            "Stride requires high-precision location services to accurately track your route, pace, and contribution metrics.",
          btn: actionText || "ENABLE LOCATION",
        };
      case "gps":
        return {
          icon: WifiOff,
          title: title ?? "GPS SIGNAL LOST",
          message:
            message ??
            "Searching for satellite connection. Move to an open sky area to resume precise route tracking.",
          btn: actionText || "RECONNECT",
        };
      case "save":
        return {
          icon: AlertOctagon,
          title: title ?? "UNABLE TO SAVE RUN",
          message:
            message ??
            "Your activity is stored locally on this device. We will automatically sync when network returns.",
          btn: actionText || "RETRY SYNC",
        };
      default:
        return {
          icon: AlertOctagon,
          title: title ?? "SOMETHING WENT WRONG",
          message:
            message ??
            "An unexpected error occurred. Please restart the tracking session.",
          btn: actionText || "DISMISS",
        };
    }
  };

  const details = getDetails();
  const Icon = details.icon;

  const handleAction = () => {
    triggerHaptic("medium");
    if (onAction) onAction();
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon size={26} color="#D4511E" />
      </View>

      <Text style={styles.title}>{details.title}</Text>
      <Text style={styles.message}>{details.message}</Text>

      {onAction && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAction}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>{details.btn}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#26130B",
    borderWidth: 1,
    borderColor: "#C2410C55",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    color: "#F5F5F5",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "monospace",
    textAlign: "center",
  },
  message: {
    color: "#71717A",
    fontSize: 13,
    fontFamily: "monospace",
    textAlign: "center",
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: "#C2410C",
    borderWidth: 1,
    borderColor: "#EA580C80",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
});
