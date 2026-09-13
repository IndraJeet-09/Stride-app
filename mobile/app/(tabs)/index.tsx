import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter } from "expo-router";
import { Flame, Clock, Navigation, ChevronRight, Sparkles, Zap } from "lucide-react-native";
import { StreakCard } from "@/components/home/StreakCard";
import { WeeklyGrid } from "@/components/home/WeeklyGrid";
import { ContributionGraph } from "@/components/contribution/ContributionGraph";
import { StrideAPI } from "@/lib/api/client";
import {
  ApiDashboard,
  ApiContributionsResponse,
  ApiRunSummary,
  ApiStravaConnection,
} from "@/lib/types";
import {
  metersToKmString,
  paceSecondsToDisplay,
  formatDuration,
  formatDate,
} from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function getWeeklyGridData(dashboard: ApiDashboard) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekDays: { day: string; distanceMeters: number; isToday: boolean }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dayOfWeek + i);
    weekDays.push({
      day: DAYS_OF_WEEK[i],
      distanceMeters: 0,
      isToday: i === dayOfWeek,
    });
  }

  if (dashboard.contributionPreview) {
    dashboard.contributionPreview.forEach((cp) => {
      const cpDate = new Date(cp.date);
      const diffDays = Math.floor((now.getTime() - cpDate.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 7) {
        const idx = dayOfWeek - diffDays;
        if (idx >= 0 && idx < 7) {
          weekDays[idx].distanceMeters = cp.distanceMeters;
        }
      }
    });
  }

  return weekDays;
}

export default function HomeScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ApiDashboard | null>(null);
  const [contributions, setContributions] = useState<ApiContributionsResponse | null>(null);
  const [runs, setRuns] = useState<ApiRunSummary[]>([]);
  const [stravaConnection, setStravaConnection] = useState<ApiStravaConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dashRes, contribRes, runsRes, stravaRes] = await Promise.all([
      StrideAPI.getDashboard(),
      StrideAPI.getContributions(new Date().getFullYear()),
      StrideAPI.getRuns({ limit: 5, sort: "desc" }),
      StrideAPI.getStravaConnection(),
    ]);

    if (dashRes.error) {
      setError(dashRes.error.message);
    } else {
      setDashboard(dashRes.data);
    }

    if (contribRes.data) {
      setContributions(contribRes.data);
    }

    if (runsRes.data) {
      setRuns(runsRes.data);
    }

    if (stravaRes.data) {
      setStravaConnection(stravaRes.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle deep link callback from Strava OAuth
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      setConnecting(false); // Always reset connecting state on callback
      if (url.includes("strava_connected=true")) {
        // Refresh data after successful connection
        fetchData();
      } else if (url.includes("strava_error=")) {
        const errorMatch = url.match(/strava_error=([^&]+)/);
        if (errorMatch) {
          const errorType = errorMatch[1];
          if (errorType === "access_denied") {
            setError("Strava connection was cancelled.");
          } else {
            setError("Failed to connect to Strava. Please try again.");
          }
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, [fetchData]);

  const handleConnectStrava = async () => {
    triggerHaptic("light");
    setConnecting(true);

    const result = await StrideAPI.connectStrava();
    if (result.data?.authUrl) {
      Linking.openURL(result.data.authUrl);
      // Don't reset connecting - the deep link handler will refresh data
    } else if (result.error) {
      setError("Failed to start Strava connection. Please try again.");
      setConnecting(false);
    }
  };

  const handleRunPress = (runId: string) => {
    triggerHaptic("light");
    router.push(`/runs/${runId}` as any);
  };

  const userName = dashboard?.user?.displayName || dashboard?.user?.username || "Runner";
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning," : greetingHour < 17 ? "Good afternoon," : "Good evening,";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyDays = dashboard ? getWeeklyGridData(dashboard) : [];
  const weeklyTotal = dashboard?.weekly?.distanceMeters ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame size={22} color="#EA580C" />
          </View>
        </View>

        {/* Connect Strava CTA - shown when not connected */}
        {stravaConnection && !stravaConnection.connected && (
          <View style={styles.stravaSection}>
            <TouchableOpacity
              style={styles.connectStravaBtn}
              onPress={handleConnectStrava}
              disabled={connecting}
              activeOpacity={0.8}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Zap size={18} color="#FFFFFF" />
                  <Text style={styles.connectStravaText}>Connect Strava</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.stravaHint}>
              Import your running activities from Strava
            </Text>
          </View>
        )}

        {/* Sync status indicator */}
        {stravaConnection?.connected && stravaConnection.syncStatus === "syncing" && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color="#EA580C" />
            <Text style={styles.syncBannerText}>Syncing your activities...</Text>
          </View>
        )}

        <View style={styles.body}>
          <StreakCard
            currentStreak={dashboard?.streak?.current ?? 0}
            longestStreak={dashboard?.streak?.longest ?? 0}
            monthlyDistanceMeters={dashboard?.monthly?.distanceMeters ?? 0}
          />

          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={15} color="#EA580C" />
              <Text style={styles.sectionHeader}>{new Date().getFullYear()} CONTRIBUTION GRAPH</Text>
            </View>
            {contributions && (
              <ContributionGraph
                data={contributions.days.map((d) => ({
                  date: d.date,
                  formattedDate: d.date,
                  dayOfWeek: new Date(d.date).getDay(),
                  weekIndex: 0,
                  distance: d.distanceMeters / 1000,
                  runsCount: d.runCount,
                  level: d.level as 0 | 1 | 2 | 3 | 4,
                  runs: [],
                }))}
                year={contributions.year}
                showSummary={true}
                currentStreak={dashboard?.streak?.current ?? 0}
                longestStreak={dashboard?.streak?.longest ?? 0}
              />
            )}
          </View>

          <WeeklyGrid days={weeklyDays} totalDistanceMeters={weeklyTotal} />

          <View style={styles.recentSection}>
            <Text style={styles.sectionHeader}>RECENT ACTIVITY</Text>

            {runs.length === 0 && (
              <Text style={styles.noRunsText}>No activities yet. Connect Strava to get started.</Text>
            )}

            {runs.slice(0, 1).map((run) => (
              <TouchableOpacity
                key={run.id}
                activeOpacity={0.7}
                onPress={() => handleRunPress(run.id)}
                style={styles.recentRunCard}
                accessibilityRole="button"
                accessibilityLabel={`Recent activity: ${run.title}, ${metersToKmString(run.distanceMeters)} kilometers`}
              >
                <View style={styles.runTopRow}>
                  <View>
                    <Text style={styles.runTitle}>{run.title}</Text>
                    <Text style={styles.runDate}>{formatDate(run.startedAt)}</Text>
                  </View>
                  <View style={styles.distWrap}>
                    <Text style={styles.distValue}>
                      {metersToKmString(run.distanceMeters)}
                      <Text style={styles.distUnit}> km</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.runBottomRow}>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={15} color="#A1A1AA" />
                      <Text style={styles.metaText}>{formatDuration(run.durationSeconds)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Navigation size={15} color="#EA580C" />
                      <Text style={[styles.metaText, { color: "#EA580C", fontWeight: "800" }]}>
                        {paceSecondsToDisplay(run.averagePaceSecondsPerKm)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#D4D4D8" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    gap: 16,
  },
  errorText: {
    color: "#F87171",
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#C2410C",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  userNameText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: "#1C1C20",
    borderWidth: 1.5,
    borderColor: "#2B2B30",
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 20,
    gap: 22,
    marginTop: 4,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeader: {
    color: "#D4D4D8",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  recentSection: {
    gap: 12,
  },
  noRunsText: {
    color: "#71717A",
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
    paddingVertical: 20,
  },
  recentRunCard: {
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "#262626",
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  runTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  runTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  runDate: {
    color: "#A1A1AA",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
    marginTop: 4,
  },
  distWrap: {
    alignItems: "flex-end",
  },
  distValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  distUnit: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "600",
  },
  runBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#222222",
    paddingTop: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    color: "#D4D4D8",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  stravaSection: {
    paddingHorizontal: 20,
    gap: 8,
  },
  connectStravaBtn: {
    backgroundColor: "#FC4C02",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  connectStravaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  stravaHint: {
    color: "#71717A",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#1C1C20",
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  syncBannerText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
  },
});
