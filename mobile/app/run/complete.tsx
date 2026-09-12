import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Flame, CheckCircle, ArrowRight, BarChart2 } from "lucide-react-native";
import { formatDuration, metersToKmString, paceSecondsToDisplay } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export default function RunCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    runId: string;
    dist: string;
    dur: string;
    elev: string;
    pace: string;
  }>();

  const dist = params.dist ?? "0";
  const dur = parseInt(params.dur ?? "0", 10);
  const elev = params.elev ?? "0";
  const pace = parseInt(params.pace ?? "0", 10);
  const runId = params.runId;

  const squareAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    triggerHaptic("success");
    Animated.sequence([
      Animated.delay(350),
      Animated.spring(squareAnim, {
        toValue: 1,
        tension: 70,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewRun = () => {
    triggerHaptic("light");
    if (runId) {
      router.replace(`/runs/${runId}`);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleViewGraph = () => {
    triggerHaptic("light");
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <CheckCircle size={36} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.eyebrow}>ACTIVITY SAVED</Text>
          <Text style={styles.title}>RUN COMPLETE</Text>

          <View style={styles.statsCard}>
            <Text style={styles.distanceText}>
              {dist}
              <Text style={styles.unitText}> KM</Text>
            </Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DURATION</Text>
                <Text style={styles.metricValue}>{formatDuration(dur)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>AVG PACE</Text>
                <Text style={[styles.metricValue, { color: "#D4511E" }]}>
                  {pace > 0
                    ? paceSecondsToDisplay(pace)
                    : dur > 0 && parseFloat(dist) > 0
                    ? paceSecondsToDisplay(Math.round(dur / parseFloat(dist)))
                    : "--:-- /km"}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>ELEVATION</Text>
                <Text style={styles.metricValue}>↑ {elev} m</Text>
              </View>
            </View>
          </View>

          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Flame size={20} color="#D4511E" />
              <Text style={styles.streakTitle}>RUN SAVED</Text>
            </View>
            <Text style={styles.streakSub}>
              Your contribution graph just got darker.
            </Text>

            <View style={styles.cellContainer}>
              <Animated.View
                style={[
                  styles.animatedSquare,
                  {
                    transform: [
                      {
                        scale: squareAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 1],
                        }),
                      },
                    ],
                    opacity: squareAnim,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleViewRun}
              style={styles.primaryBtn}
              accessibilityLabel="View Run Details"
            >
              <Text style={styles.primaryBtnText}>VIEW RUN</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleViewGraph}
              style={styles.secondaryBtn}
              accessibilityLabel="View History Graph"
            >
              <BarChart2 size={18} color="#A1A1AA" />
              <Text style={styles.secondaryBtnText}>VIEW GRAPH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#C2410C",
    borderWidth: 2,
    borderColor: "#EA580C80",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C2410C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  eyebrow: {
    color: "#71717A",
    fontSize: 12,
    fontFamily: "monospace",
    letterSpacing: 3,
    textAlign: "center",
    fontWeight: "700",
  },
  title: {
    color: "#F5F5F5",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "monospace",
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 18,
    padding: 24,
    marginTop: 28,
  },
  distanceText: {
    color: "#F5F5F5",
    fontSize: 48,
    fontWeight: "900",
    fontFamily: "monospace",
    textAlign: "center",
    letterSpacing: -1,
  },
  unitText: {
    color: "#D4511E",
    fontSize: 24,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#222222",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    color: "#71717A",
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  metricValue: {
    color: "#F5F5F5",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "monospace",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "#27272A",
  },
  streakCard: {
    backgroundColor: "#1C110C",
    borderWidth: 1,
    borderColor: "#C2410C55",
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
    alignItems: "center",
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakTitle: {
    color: "#D4511E",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  streakSub: {
    color: "#A1A1AA",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: 4,
  },
  cellContainer: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  animatedSquare: {
    width: 24,
    height: 24,
    backgroundColor: "#D4511E",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#EA580C",
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 14,
    backgroundColor: "#C2410C",
    borderWidth: 1,
    borderColor: "#EA580C80",
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#27272A",
    gap: 8,
  },
  secondaryBtnText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
});
