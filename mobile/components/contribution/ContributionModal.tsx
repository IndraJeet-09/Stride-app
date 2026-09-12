import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { DayContribution } from "@/lib/types";
import { ArrowRight, Clock, Navigation, X, Flame } from "lucide-react-native";
import { triggerHaptic } from "@/lib/haptics";

interface ContributionModalProps {
  day: DayContribution | null;
  visible: boolean;
  onClose: () => void;
}

const LEVEL_LABELS: Record<number, string> = {
  0: "Rest Day",
  1: "Light Effort (1-3 km)",
  2: "Moderate Run (3-6 km)",
  3: "Strong Effort (6-10 km)",
  4: "High Distance (10+ km)",
};

export function ContributionModal({ day, visible, onClose }: ContributionModalProps) {
  const router = useRouter();

  if (!day) return null;

  const formattedDate = (() => {
    try {
      return format(parseISO(day.date), "EEEE, MMMM d, yyyy");
    } catch {
      return day.date;
    }
  })();

  const handleNavigateToRun = (runId: string) => {
    triggerHaptic("light");
    onClose();
    router.push(`/runs/${runId}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              {/* Grabber Bar */}
              <View style={styles.grabber} />

              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.dateText}>{formattedDate}</Text>
                  <Text style={styles.levelBadge}>{LEVEL_LABELS[day.level]}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic("light");
                    onClose();
                  }}
                  style={styles.closeBtn}
                  accessibilityLabel="Close bottom sheet"
                >
                  <X size={18} color="#A1A1AA" />
                </TouchableOpacity>
              </View>

              {/* Summary Stats */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>TOTAL DISTANCE</Text>
                  <Text style={styles.summaryValue}>
                    {day.distance.toFixed(2)}
                    <Text style={styles.unit}> km</Text>
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>RUNS LOGGED</Text>
                  <Text style={styles.summaryValue}>{day.count}</Text>
                </View>
              </View>

              {/* Runs Breakdown */}
              {day.runs && day.runs.length > 0 ? (
                <View style={styles.runsSection}>
                  <Text style={styles.sectionTitle}>LOGGED ACTIVITIES</Text>
                  {day.runs.map((run) => (
                    <View key={run.id} style={styles.runCard}>
                      <View style={styles.runCardHeader}>
                        <View style={styles.titleRow}>
                          <Flame size={14} color="#D4511E" />
                          <Text style={styles.runTitle}>{run.title}</Text>
                        </View>
                        <Text style={styles.runDist}>{run.distance.toFixed(2)} km</Text>
                      </View>

                      <View style={styles.runMetaRow}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color="#71717A" />
                          <Text style={styles.metaText}>{run.durationFormatted}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Navigation size={12} color="#C2410C" />
                          <Text style={[styles.metaText, { color: "#D4511E", fontWeight: "700" }]}>
                            {run.avgPace}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleNavigateToRun(run.id)}
                        style={styles.viewRunBtn}
                        accessibilityLabel="View Run Details"
                      >
                        <Text style={styles.viewRunText}>View Run</Text>
                        <ArrowRight size={14} color="#D4511E" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>Rest Day</Text>
                  <Text style={styles.emptySub}>No running activity recorded on this date.</Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#222222",
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: "80%",
  },
  grabber: {
    width: 36,
    height: 4,
    backgroundColor: "#333333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateText: {
    color: "#F5F5F5",
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  levelBadge: {
    color: "#D4511E",
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    color: "#71717A",
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: "#F5F5F5",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "monospace",
    marginTop: 2,
  },
  unit: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "400",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#27272A",
    marginHorizontal: 16,
  },
  runsSection: {
    gap: 10,
  },
  sectionTitle: {
    color: "#71717A",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 1,
  },
  runCard: {
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  runCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  runTitle: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  runDist: {
    color: "#D4511E",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  runMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontFamily: "monospace",
  },
  viewRunBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#26130B",
    borderWidth: 1,
    borderColor: "#C2410C55",
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  viewRunText: {
    color: "#D4511E",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  emptySub: {
    color: "#71717A",
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
  },
});
