import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { metersToKmString } from "@/lib/utils";

interface WeeklyGridProps {
  days: { day: string; distanceMeters: number; isToday?: boolean }[];
  totalDistanceMeters: number;
}

export function WeeklyGrid({ days, totalDistanceMeters }: WeeklyGridProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>THIS WEEK</Text>
        <Text style={styles.subtitle}>{metersToKmString(totalDistanceMeters)} km logged</Text>
      </View>

      <View style={styles.grid}>
        {days.map((item, idx) => {
          const hasRun = item.distanceMeters > 0;
          const distKm = item.distanceMeters / 1000;
          return (
            <View key={`${item.day}-${idx}`} style={styles.dayCol}>
              <View
                style={[
                  styles.daySquare,
                  hasRun && styles.daySquareFilled,
                  item.isToday && styles.daySquareToday,
                ]}
              >
                {hasRun && (
                  <Text style={styles.distText}>
                    {distKm >= 10 ? Math.round(distKm) : distKm.toFixed(1)}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  item.isToday && styles.dayLabelToday,
                ]}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  subtitle: {
    color: "#EA580C",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
  },
  daySquare: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#1C1C20",
    borderWidth: 1.5,
    borderColor: "#2B2B30",
    alignItems: "center",
    justifyContent: "center",
  },
  daySquareFilled: {
    backgroundColor: "#C2410C",
    borderColor: "#EA580C",
  },
  daySquareToday: {
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#EA580C",
  },
  distText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  dayLabel: {
    color: "#A1A1AA",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  dayLabelToday: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
