import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Flame, TrendingUp } from "lucide-react-native";
import { metersToKmString } from "@/lib/utils";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  monthlyDistanceMeters: number;
}

export function StreakCard({ currentStreak, longestStreak, monthlyDistanceMeters }: StreakCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.col}>
        <View style={styles.labelRow}>
          <Flame size={16} color="#EA580C" />
          <Text style={styles.label}>STREAK</Text>
        </View>
        <Text style={styles.valueLarge}>
          {currentStreak} <Text style={styles.unitOrange}>DAYS</Text>
        </Text>
        <Text style={styles.subtext}>Personal best: {longestStreak} days</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.col}>
        <View style={styles.labelRow}>
          <TrendingUp size={16} color="#34D399" />
          <Text style={styles.label}>THIS MONTH</Text>
        </View>
        <Text style={styles.valueLarge}>
          {metersToKmString(monthlyDistanceMeters)} <Text style={styles.unitGray}>KM</Text>
        </Text>
        <Text style={styles.subtext}>{monthlyDistanceMeters > 0 ? "Keep it up!" : "Start running!"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 18,
    padding: 20,
    justifyContent: "space-between",
  },
  col: {
    flex: 1,
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: "#D4D4D8",
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  valueLarge: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  unitOrange: {
    color: "#EA580C",
    fontSize: 15,
    fontWeight: "800",
  },
  unitGray: {
    color: "#A1A1AA",
    fontSize: 15,
    fontWeight: "700",
  },
  subtext: {
    color: "#A1A1AA",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  divider: {
    width: 1.5,
    height: "100%",
    backgroundColor: "#262626",
    marginHorizontal: 16,
  },
});
