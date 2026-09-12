import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Trophy, Zap, Mountain, Gauge } from "lucide-react-native";
import { ApiStatsOverview } from "@/lib/types";
import {
  metersToKmString,
  paceSecondsToDisplay,
  paceSecondsToString,
} from "@/lib/utils";

interface ProfileStatsProps {
  stats: ApiStatsOverview | null;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const overview = stats?.overview;
  const prs = stats?.personalRecords;

  const fastest5k = prs?.fastest5k ? paceSecondsToString(prs.fastest5k) : "--:--";
  const fastest10k = prs?.fastest10k ? paceSecondsToString(prs.fastest10k) : "--:--";
  const longestRun = prs?.longestRunMeters ? metersToKmString(prs.longestRunMeters) : "--";
  const highestElev = prs?.highestElevationMeters ?? 0;

  const avgPace = overview?.averagePaceSecondsPerKm
    ? paceSecondsToDisplay(overview.averagePaceSecondsPerKm)
    : "--:-- /km";
  const avgDist = overview?.averageDistanceMeters
    ? metersToKmString(overview.averageDistanceMeters)
    : "--";
  const totalElev = 0;

  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <View style={styles.blockHeaderRow}>
          <Trophy size={16} color="#EA580C" />
          <Text style={styles.blockTitle}>PERSONAL RECORDS</Text>
        </View>

        <View style={styles.prGrid}>
          <View style={styles.prCard}>
            <Text style={styles.prLabel}>FASTEST 5K</Text>
            <Text style={styles.prValue}>{fastest5k}</Text>
            <Text style={styles.prPace}>
              {prs?.fastest5k ? paceSecondsToDisplay(prs.fastest5k) : "No data"}
            </Text>
          </View>

          <View style={styles.prCard}>
            <Text style={styles.prLabel}>FASTEST 10K</Text>
            <Text style={styles.prValue}>{fastest10k}</Text>
            <Text style={styles.prPace}>
              {prs?.fastest10k ? paceSecondsToDisplay(prs.fastest10k) : "No data"}
            </Text>
          </View>

          <View style={styles.prCard}>
            <Text style={styles.prLabel}>LONGEST RUN</Text>
            <Text style={styles.prValue}>{longestRun} km</Text>
            <Text style={styles.prPace}>Single run</Text>
          </View>

          <View style={styles.prCard}>
            <Text style={styles.prLabel}>MAX ELEVATION</Text>
            <Text style={styles.prValue}>↑ {highestElev}m</Text>
            <Text style={styles.prPace}>Gain in one run</Text>
          </View>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.blockHeaderRow}>
          <Gauge size={16} color="#EA580C" />
          <Text style={styles.blockTitle}>SEASON AVERAGES</Text>
        </View>

        <View style={styles.statsList}>
          <View style={styles.statRow}>
            <View style={styles.statLabelWrap}>
              <Zap size={15} color="#A1A1AA" />
              <Text style={styles.rowLabel}>Average Pace</Text>
            </View>
            <Text style={[styles.rowValue, { color: "#EA580C" }]}>
              {avgPace}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.statRow}>
            <View style={styles.statLabelWrap}>
              <Gauge size={15} color="#A1A1AA" />
              <Text style={styles.rowLabel}>Avg Distance / Run</Text>
            </View>
            <Text style={styles.rowValue}>
              {avgDist} km
            </Text>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.statRow}>
            <View style={styles.statLabelWrap}>
              <Mountain size={15} color="#A1A1AA" />
              <Text style={styles.rowLabel}>Total Elevation Gain</Text>
            </View>
            <Text style={styles.rowValue}>
              ↑ {totalElev} m
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  block: {
    gap: 12,
  },
  blockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  blockTitle: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  prGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  prCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  prLabel: {
    color: "#A1A1AA",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  prValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  prPace: {
    color: "#EA580C",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  statsList: {
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  statLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLabel: {
    color: "#D4D4D8",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  rowValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  rowDivider: {
    height: 1.5,
    backgroundColor: "#222222",
  },
});
