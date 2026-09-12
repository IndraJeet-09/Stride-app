import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Play, Pause, Square, Wifi, ChevronLeft, Mountain, Navigation, AlertTriangle } from "lucide-react-native";
import { formatDuration } from "@/lib/utils";
import { StrideAPI } from "@/lib/api/client";
import { ApiRunCreated } from "@/lib/types";
import { triggerHaptic } from "@/lib/haptics";

export default function RunScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elevationM, setElevationM] = useState(0);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runRef = useRef<ApiRunCreated | null>(null);
  const sequenceRef = useRef(1);
  const pointsBufferRef = useRef<any[]>([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startRun = async () => {
      const clientRunId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await StrideAPI.startRun({
        clientRunId,
        startedAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res.data) {
        runRef.current = res.data;
      }
    };
    startRun();
  }, []);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
        setDistanceKm((d) => Math.round((d + 0.003) * 1000) / 1000);
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleRunning = () => {
    triggerHaptic("light");
    setIsRunning((prev) => !prev);
  };

  const handleRequestFinish = () => {
    triggerHaptic("medium");
    setIsRunning(false);
    setShowConfirmFinish(true);
  };

  const handleCancelFinish = () => {
    triggerHaptic("light");
    setShowConfirmFinish(false);
    setIsRunning(true);
  };

  const handleConfirmFinish = async () => {
    triggerHaptic("success");
    setShowConfirmFinish(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const run = runRef.current;
    if (run) {
      await StrideAPI.finishRun(run.id, new Date().toISOString());
      router.replace({
        pathname: "/run/complete",
        params: {
          runId: run.id,
          dist: distanceKm.toFixed(2),
          dur: String(seconds),
          elev: String(elevationM),
        },
      });
    } else {
      router.replace("/(tabs)");
    }
  };

  const paceStr =
    distanceKm > 0
      ? (() => {
          const secPerKm = Math.round(seconds / distanceKm);
          return `${Math.floor(secPerKm / 60)}:${(secPerKm % 60).toString().padStart(2, "0")}`;
        })()
      : "0:00";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic("light");
              router.back();
            }}
            style={styles.backButton}
            accessibilityLabel="Exit run tracking"
          >
            <ChevronLeft size={22} color="#A1A1AA" />
          </TouchableOpacity>

          <View style={styles.gpsPill}>
            <Wifi size={13} color="#10B981" />
            <Text style={styles.gpsText}>GPS Active</Text>
          </View>

          <View style={styles.streakPill}>
            <Text style={styles.streakText}>RUNNING</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor: isRunning ? "#D4511E" : "#F59E0B",
                opacity: isRunning ? pulseAnim : 1,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {isRunning ? "RUNNING IN PROGRESS" : "PAUSED"}
          </Text>
        </View>

        <View style={styles.hudBody}>
          <View style={styles.distanceBlock}>
            <Text style={styles.distanceValue}>
              {distanceKm < 10 ? `0${distanceKm.toFixed(2)}` : distanceKm.toFixed(2)}
            </Text>
            <Text style={styles.distanceUnit}>KM</Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconLabel}>
                <Navigation size={12} color="#C2410C" />
                <Text style={styles.metricLabel}>PACE</Text>
              </View>
              <Text style={styles.metricValue}>{paceStr}</Text>
              <Text style={styles.metricUnit}>/KM</Text>
            </View>

            <View style={styles.metricsDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ELAPSED</Text>
              <Text style={styles.metricValue}>{formatDuration(seconds)}</Text>
              <Text style={styles.metricUnit}>TIME</Text>
            </View>
          </View>

          <View style={styles.telemetryPill}>
            <View style={styles.telemetryItem}>
              <Mountain size={13} color="#A1A1AA" />
              <Text style={styles.telemetryText}>↑ {elevationM} m</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <Text style={styles.telemetryText}>{Math.round(distanceKm * 72)} kcal</Text>
          </View>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleRunning}
              style={[
                styles.actionButton,
                isRunning ? styles.pauseButton : styles.resumeButton,
              ]}
              accessibilityLabel={isRunning ? "Pause Run" : "Resume Run"}
            >
              {isRunning ? (
                <>
                  <Pause size={20} color="#F5F5F5" />
                  <Text style={styles.actionTextWhite}>PAUSE</Text>
                </>
              ) : (
                <>
                  <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.actionTextWhite}>RESUME</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRequestFinish}
              style={[styles.actionButton, styles.finishButton]}
              accessibilityLabel="Finish Run"
            >
              <Square size={18} color="#EF4444" fill="#EF4444" />
              <Text style={styles.finishText}>FINISH</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showConfirmFinish}
          transparent
          animationType="fade"
          onRequestClose={handleCancelFinish}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <AlertTriangle size={24} color="#D4511E" />
              </View>

              <Text style={styles.modalTitle}>Finish this run?</Text>
              <Text style={styles.modalSub}>
                Your progress will be saved and your streak will update.
              </Text>

              <View style={styles.modalSummaryPill}>
                <Text style={styles.modalSummaryDist}>{distanceKm.toFixed(2)} km</Text>
                <Text style={styles.modalSummaryDur}>{formatDuration(seconds)}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleCancelFinish}
                  style={styles.modalCancelBtn}
                >
                  <Text style={styles.modalCancelText}>Keep Running</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirmFinish}
                  style={styles.modalConfirmBtn}
                >
                  <Text style={styles.modalConfirmText}>Finish Run</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  gpsText: {
    fontSize: 12,
    color: "#34D399",
    fontFamily: "monospace",
    fontWeight: "600",
  },
  streakPill: {
    backgroundColor: "#26130B",
    borderWidth: 1,
    borderColor: "#C2410C66",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    color: "#D4511E",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontFamily: "monospace",
    letterSpacing: 2,
    fontWeight: "600",
  },
  hudBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  distanceBlock: {
    alignItems: "center",
  },
  distanceValue: {
    fontSize: 84,
    fontWeight: "900",
    fontFamily: "monospace",
    color: "#F5F5F5",
    letterSpacing: -2,
    lineHeight: 92,
  },
  distanceUnit: {
    color: "#D4511E",
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 4,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    borderTopWidth: 1,
    borderTopColor: "#222222",
    paddingTop: 28,
    width: "80%",
    gap: 28,
  },
  metricItem: {
    alignItems: "center",
    minWidth: 80,
  },
  metricIconLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    color: "#71717A",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
    letterSpacing: 1,
  },
  metricValue: {
    color: "#F5F5F5",
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "monospace",
    marginTop: 2,
  },
  metricUnit: {
    color: "#71717A",
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  metricsDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#27272A",
  },
  telemetryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 28,
    gap: 16,
  },
  telemetryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  telemetryText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontFamily: "monospace",
  },
  telemetryDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#27272A",
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  controlRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 58,
    borderRadius: 14,
    gap: 8,
  },
  pauseButton: {
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  resumeButton: {
    backgroundColor: "#C2410C",
    borderWidth: 1,
    borderColor: "#EA580C80",
  },
  actionTextWhite: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  finishButton: {
    backgroundColor: "#2A1215",
    borderWidth: 1,
    borderColor: "#7F1D1D80",
  },
  finishText: {
    color: "#F87171",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#26130B",
    borderWidth: 1,
    borderColor: "#C2410C55",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "monospace",
    color: "#F5F5F5",
    textAlign: "center",
  },
  modalSub: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  modalSummaryPill: {
    flexDirection: "row",
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
    marginTop: 16,
  },
  modalSummaryDist: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  modalSummaryDur: {
    color: "#D4511E",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#18181B",
    borderWidth: 1,
    borderColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#C2410C",
    borderWidth: 1,
    borderColor: "#EA580C80",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
});
