import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Calendar, Clock, Navigation, Mountain, Flame, Heart, ExternalLink } from "lucide-react-native";
import { StrideAPI } from "@/lib/api/client";
import { ApiRunDetail } from "@/lib/types";
import {
  metersToKmString,
  paceSecondsToDisplay,
  formatDuration,
  formatDate,
  formatTime,
} from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [run, setRun] = useState<ApiRunDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchRun = async () => {
      const res = await StrideAPI.getRunDetail(id);
      if (res.data) {
        setRun(res.data);
      }
      setLoading(false);
    };
    fetchRun();
  }, [id]);

  const handleBack = () => {
    triggerHaptic("light");
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!run) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: "#F87171", fontFamily: "monospace" }}>Activity not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityLabel="Back to previous screen"
          >
            <ChevronLeft size={22} color="#A1A1AA" />
          </TouchableOpacity>

          <View style={styles.badgeWrap}>
            <Flame size={13} color="#D4511E" />
            <Text style={styles.badgeText}>CONTRIBUTION EARNED</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleSection}>
            <Text style={styles.runTitle}>{run.title}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color="#71717A" />
              <Text style={styles.dateText}>
                {formatDate(run.startedAt)} · {formatTime(run.startedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.distanceBlock}>
            <Text style={styles.distanceNumber}>
              {metersToKmString(run.distanceMeters)}
            </Text>
            <Text style={styles.distanceLabel}>KM</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <View style={styles.statIconRow}>
                <Clock size={12} color="#71717A" />
                <Text style={styles.statLabel}>TIME</Text>
              </View>
              <Text style={styles.statVal}>{formatDuration(run.durationSeconds)}</Text>
            </View>

            <View style={styles.vertDivider} />

            <View style={styles.statCol}>
              <View style={styles.statIconRow}>
                <Navigation size={12} color="#C2410C" />
                <Text style={styles.statLabel}>AVG PACE</Text>
              </View>
              <Text style={[styles.statVal, { color: "#D4511E" }]}>
                {paceSecondsToDisplay(run.averagePaceSecondsPerKm)}
              </Text>
            </View>

            <View style={styles.vertDivider} />

            <View style={styles.statCol}>
              <View style={styles.statIconRow}>
                <Mountain size={12} color="#71717A" />
                <Text style={styles.statLabel}>ELEVATION</Text>
              </View>
              <Text style={styles.statVal}>↑ {run.elevationGainMeters}m</Text>
            </View>

            <View style={styles.vertDivider} />

            <View style={styles.statCol}>
              {run.averageHeartrate ? (
                <>
                  <View style={styles.statIconRow}>
                    <Heart size={12} color="#71717A" />
                    <Text style={styles.statLabel}>AVG HR</Text>
                  </View>
                  <Text style={styles.statVal}>{Math.round(run.averageHeartrate)} bpm</Text>
                </>
              ) : (
                <>
                  <Text style={styles.statLabel}>ENERGY</Text>
                  <Text style={styles.statVal}>{run.calories} kcal</Text>
                </>
              )}
            </View>
          </View>

          {/* View on Strava link */}
          {run.stravaUrl && (
            <TouchableOpacity
              style={styles.stravaLinkBtn}
              onPress={() => Linking.openURL(run.stravaUrl!)}
              activeOpacity={0.7}
            >
              <ExternalLink size={16} color="#FC4C02" />
              <Text style={styles.stravaLinkText}>View on Strava</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },
  scrollContent: {
    paddingBottom: 36,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C110C",
    borderWidth: 1,
    borderColor: "#C2410C55",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  badgeText: {
    color: "#D4511E",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 22,
  },
  titleSection: {
    gap: 4,
  },
  runTitle: {
    color: "#F5F5F5",
    fontSize: 28,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: "#71717A",
    fontSize: 13,
    fontFamily: "monospace",
  },
  distanceBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  distanceNumber: {
    color: "#D4511E",
    fontSize: 56,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -1,
  },
  distanceLabel: {
    color: "#A1A1AA",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    color: "#71717A",
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  statVal: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  vertDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#222222",
  },
  stravaLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1C110C",
    borderWidth: 1,
    borderColor: "#FC4C0233",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  stravaLinkText: {
    color: "#FC4C02",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
});
