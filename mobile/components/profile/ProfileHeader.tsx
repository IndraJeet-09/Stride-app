import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Flame } from "lucide-react-native";
import { ApiUser, ApiStatsOverview } from "@/lib/types";
import { metersToKmString } from "@/lib/utils";

interface ProfileHeaderProps {
  user: ApiUser | null;
  stats: ApiStatsOverview | null;
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const totalDistanceKm = stats ? metersToKmString(stats.overview.totalDistanceMeters) : "0.00";
  const totalRuns = stats?.overview.totalRuns ?? 0;
  const currentStreak = stats?.overview.currentStreak ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarLetter}>
              {(user?.displayName || user?.username || "R").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.badgeFlame}>
          <Flame size={14} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.name}>{user?.displayName || user?.username || "Runner"}</Text>
      {user?.username && (
        <Text style={styles.meta}>@{user.username}</Text>
      )}

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{totalDistanceKm}</Text>
          <Text style={styles.metricLabel}>KM LOGGED</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{totalRuns}</Text>
          <Text style={styles.metricLabel}>TOTAL RUNS</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: "#EA580C" }]}>
            {currentStreak}d
          </Text>
          <Text style={[styles.metricLabel, { color: "#EA580C" }]}>
            DAY STREAK
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 20,
    padding: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    borderColor: "#C2410C",
    backgroundColor: "#1C1C20",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  badgeFlame: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#C2410C",
    borderWidth: 2,
    borderColor: "#111111",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  meta: {
    color: "#A1A1AA",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1.5,
    borderTopColor: "#222222",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  metricLabel: {
    color: "#D4D4D8",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  divider: {
    width: 1.5,
    height: 32,
    backgroundColor: "#222222",
  },
});
