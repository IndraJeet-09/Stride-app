import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Share,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { Share2, Clock, Navigation, Mountain, ChevronRight, History, LogOut } from "lucide-react-native";
import { StrideAPI } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { ApiUser, ApiStatsOverview, ApiRunSummary } from "@/lib/types";
import {
  metersToKmString,
  paceSecondsToDisplay,
  formatDuration,
  formatDate,
} from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [stats, setStats] = useState<ApiStatsOverview | null>(null);
  const [runs, setRuns] = useState<ApiRunSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [meRes, statsRes, runsRes] = await Promise.all([
      StrideAPI.getMe(),
      StrideAPI.getStats(),
      StrideAPI.getRuns({ limit: 20, sort: "desc" }),
    ]);

    if (meRes.data?.user) setUser(meRes.data.user);
    if (statsRes.data) setStats(statsRes.data);
    if (runsRes.data) setRuns(runsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunPress = (runId: string) => {
    triggerHaptic("light");
    router.push(`/runs/${runId}`);
  };

  const handleShare = async () => {
    triggerHaptic("medium");
    const distKm = stats ? metersToKmString(stats.overview.totalDistanceMeters) : "0";
    const streak = stats?.overview.currentStreak ?? 0;
    try {
      await Share.share({
        message: `Check out my Stride running profile! ${distKm} km logged with a ${streak} day streak`,
        title: "Stride Athlete Profile",
      });
    } catch {}
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>PROFILE</Text>
        </View>

        <View style={styles.body}>
          <ProfileHeader user={user} stats={stats} />
          <ProfileStats stats={stats} />

          <View style={styles.horizontalDivider} />

          <View style={styles.sectionBlock}>
            <View style={styles.historyHeaderRow}>
              <History size={16} color="#EA580C" />
              <Text style={styles.sectionTitle}>ACTIVITY HISTORY</Text>
            </View>

            <View style={styles.runsList}>
              {runs.length === 0 && (
                <Text style={styles.noRunsText}>No runs yet.</Text>
              )}
              {runs.map((run) => (
                <TouchableOpacity
                  key={run.id}
                  activeOpacity={0.7}
                  onPress={() => handleRunPress(run.id)}
                  style={styles.runRow}
                  accessibilityRole="button"
                >
                  <View style={styles.runRowHeader}>
                    <View>
                      <Text style={styles.runRowDate}>{formatDate(run.startedAt)}</Text>
                      <Text style={styles.runRowTitle}>{run.title}</Text>
                    </View>
                    <View style={styles.runRowDistWrap}>
                      <Text style={styles.runRowDist}>
                        {metersToKmString(run.distanceMeters)}
                      </Text>
                      <Text style={styles.runRowDistUnit}>km</Text>
                    </View>
                  </View>

                  <View style={styles.runRowFooter}>
                    <View style={styles.runRowMetaList}>
                      <View style={styles.metaBadge}>
                        <Clock size={14} color="#A1A1AA" />
                        <Text style={styles.metaBadgeText}>
                          {formatDuration(run.durationSeconds)}
                        </Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Navigation size={14} color="#EA580C" />
                        <Text style={[styles.metaBadgeText, { color: "#EA580C", fontWeight: "800" }]}>
                          {paceSecondsToDisplay(run.averagePaceSecondsPerKm)}
                        </Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Mountain size={14} color="#A1A1AA" />
                        <Text style={styles.metaBadgeText}>
                          ↑{run.elevationGainMeters}m
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#D4D4D8" strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            style={styles.shareBtn}
            accessibilityRole="button"
            accessibilityLabel="Share profile"
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text style={styles.shareText}>SHARE PROFILE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={logout}
            style={styles.logoutBtn}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <LogOut size={18} color="#F87171" />
            <Text style={styles.logoutText}>LOG OUT</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  screenTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
  },
  body: {
    paddingHorizontal: 20,
    gap: 22,
  },
  horizontalDivider: {
    height: 1.5,
    backgroundColor: "#222222",
    marginVertical: 4,
  },
  sectionBlock: {
    gap: 14,
  },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  runsList: {
    gap: 14,
  },
  noRunsText: {
    color: "#71717A",
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
    paddingVertical: 20,
  },
  runRow: {
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  runRowHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  runRowDate: {
    color: "#A1A1AA",
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  runRowTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
    marginTop: 3,
  },
  runRowDistWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  runRowDist: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  runRowDistUnit: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  runRowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#222222",
    paddingTop: 12,
  },
  runRowMetaList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaBadgeText: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#333333",
    backgroundColor: "#18181B",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  shareText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 1.2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#7F1D1D40",
    backgroundColor: "#1C110C",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  logoutText: {
    color: "#F87171",
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 1.2,
  },
});
