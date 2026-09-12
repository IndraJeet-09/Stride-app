import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { DayContribution } from "@/lib/types";
import { ContributionCell } from "./ContributionCell";
import { ContributionModal } from "./ContributionModal";

interface ContributionGraphProps {
  data: DayContribution[];
  year?: number;
  showSummary?: boolean;
  currentStreak?: number;
  longestStreak?: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function ContributionGraph({
  data,
  year = new Date().getFullYear(),
  showSummary = true,
  currentStreak = 0,
  longestStreak = 0,
}: ContributionGraphProps) {
  const [selectedDay, setSelectedDay] = useState<DayContribution | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to latest contributions on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Split into 52 weeks x 7 days
  const weeks = useMemo(() => {
    const res: DayContribution[][] = [];
    for (let i = 0; i < data.length; i += 7) {
      res.push(data.slice(i, i + 7));
    }
    return res;
  }, [data]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalDist = 0;
    let activeDays = 0;
    data.forEach((d) => {
      totalDist += d.distance;
      if (d.distance > 0) activeDays++;
    });
    return {
      totalDist: Math.round(totalDist * 10) / 10,
      activeDays,
      longestStreak,
      currentStreak,
    };
  }, [data, longestStreak, currentStreak]);

  const handleDayPress = (day: DayContribution) => {
    setSelectedDay(day);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* 52-Week Grid Scroll Area */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gridOuter}>
          {/* Month Labels */}
          <View style={styles.monthsRow}>
            <View style={styles.dayLabelSpacer} />
            <View style={styles.monthNamesContainer}>
              {MONTHS.map((m) => (
                <Text key={m} style={styles.monthText}>
                  {m}
                </Text>
              ))}
            </View>
          </View>

          {/* Grid + Day Labels */}
          <View style={styles.gridRow}>
            {/* Day of Week Labels (Mon, Wed, Fri) */}
            <View style={styles.dayLabelsCol}>
              <Text style={styles.dayLabelText}>Mon</Text>
              <Text style={styles.dayLabelText}>Wed</Text>
              <Text style={styles.dayLabelText}>Fri</Text>
            </View>

            {/* Matrix of Columns (Weeks) */}
            <View style={styles.weeksContainer}>
              {weeks.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekColumn}>
                  {week.map((day) => (
                    <ContributionCell
                      key={day.date}
                      day={day}
                      size={13}
                      isSelected={selectedDay?.date === day.date && modalVisible}
                      onPress={handleDayPress}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>Less</Text>
            <View style={[styles.legendSquare, { backgroundColor: "#1C1C20" }]} />
            <View style={[styles.legendSquare, { backgroundColor: "#832E12" }]} />
            <View style={[styles.legendSquare, { backgroundColor: "#A33814" }]} />
            <View style={[styles.legendSquare, { backgroundColor: "#C2410C" }]} />
            <View style={[styles.legendSquare, { backgroundColor: "#EA580C" }]} />
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>
      </ScrollView>

      {/* Summary Stats Row */}
      {showSummary && (
        <View style={styles.summaryContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{summary.totalDist}</Text>
            <Text style={styles.statLbl}>KM LOGGED</Text>
          </View>
          <View style={styles.vertLine} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{summary.activeDays}</Text>
            <Text style={styles.statLbl}>ACTIVE DAYS</Text>
          </View>
          <View style={styles.vertLine} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: "#EA580C" }]}>
              {summary.currentStreak}d
            </Text>
            <Text style={styles.statLbl}>CURRENT STREAK</Text>
          </View>
        </View>
      )}

      {/* Interactive Bottom Sheet Modal */}
      <ContributionModal
        day={selectedDay}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 18,
    paddingVertical: 18,
    overflow: "hidden",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  gridOuter: {
    gap: 6,
  },
  monthsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dayLabelSpacer: {
    width: 32,
  },
  monthNamesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 52 * 17.4,
    paddingRight: 16,
  },
  monthText: {
    color: "#D4D4D8",
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dayLabelsCol: {
    width: 32,
    justifyContent: "space-around",
    height: 7 * 17.4,
    paddingVertical: 4,
  },
  dayLabelText: {
    color: "#A1A1AA",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  weeksContainer: {
    flexDirection: "row",
  },
  weekColumn: {
    flexDirection: "column",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 14,
    gap: 6,
  },
  legendText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "600",
    marginHorizontal: 4,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  summaryContainer: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: "#262626",
    marginTop: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statVal: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  statLbl: {
    color: "#A1A1AA",
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 4,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  vertLine: {
    width: 1.5,
    height: 32,
    backgroundColor: "#262626",
    alignSelf: "center",
  },
});
