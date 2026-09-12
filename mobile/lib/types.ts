export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

// --- Legacy mock types (kept for backward compat) ---

export interface RunSplit {
  km: number;
  pace: string;
  paceSeconds: number;
  elevationGain: number;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RunActivity {
  id: string;
  title: string;
  date: string;
  formattedDate: string;
  timeOfDay: string;
  distance: number;
  durationSeconds: number;
  durationFormatted: string;
  avgPace: string;
  elevationGain: number;
  calories: number;
  category: string;
  splits: RunSplit[];
  routePoints: RoutePoint[];
}

export interface ContributionDay {
  date: string;
  formattedDate: string;
  dayOfWeek: number;
  weekIndex: number;
  distance: number;
  runsCount: number;
  count?: number;
  level: IntensityLevel;
  intensity?: IntensityLevel;
  runs: RunActivity[];
}

export type DayContribution = ContributionDay;

export interface WeeklyActivityItem {
  day: string;
  distance: number;
  isToday?: boolean;
}

export interface RunnerProfile {
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  location: string;
  memberSince: string;
  totalDistanceKm: number;
  totalRuns: number;
  currentStreakDays: number;
  longestStreakDays: number;
  longestRunKm: number;
  avgPace: string;
  totalElevationMeters: number;
  prs: {
    fastest5k: string;
    fastest10k: string;
    longestRunKm: number;
    maxElevationM: number;
  };
  aggregateStats: {
    avgPace: string;
    avgDistanceKm: number;
    totalElevationM: number;
  };
}

// --- API response types (backend shapes) ---

export interface ApiUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  unitSystem?: "metric" | "imperial";
  isPublic?: boolean;
}

export interface ApiStreak {
  current: number;
  longest: number;
  currentStreakStartDate?: string;
  lastActiveDate?: string;
}

export interface ApiWeekly {
  distanceMeters: number;
  durationSeconds: number;
  runCount: number;
}

export interface ApiMonthly {
  distanceMeters: number;
  runCount: number;
}

export interface ApiRunSummary {
  id: string;
  title: string;
  status?: string;
  startedAt: string;
  endedAt?: string;
  distanceMeters: number;
  durationSeconds: number;
  averagePaceSecondsPerKm: number;
  elevationGainMeters: number;
  calories: number;
  visibility?: string;
}

export interface ApiDashboardStats {
  totalRuns: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  longestRunMeters: number;
  fastestPaceSecondsPerKm: number;
}

export interface ApiDashboard {
  user: ApiUser;
  streak: ApiStreak;
  weekly: ApiWeekly;
  monthly: ApiMonthly;
  recentRun: ApiRunSummary | null;
  contributionPreview: ApiContributionDay[];
  stats: ApiDashboardStats;
}

export interface ApiContributionDay {
  date: string;
  runCount: number;
  distanceMeters: number;
  level: number;
}

export interface ApiContributionsResponse {
  year: number;
  timezone: string;
  days: ApiContributionDay[];
}

export interface ApiRunDetail {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  timezone: string;
  distanceMeters: number;
  durationSeconds: number;
  movingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  averageSpeedMps: number;
  maxSpeedMps: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  calories: number;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  routePolyline?: string;
  notes?: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiStatsOverview {
  overview: {
    totalRuns: number;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    averageDistanceMeters: number;
    averagePaceSecondsPerKm: number;
    longestRunMeters: number;
    fastestPaceSecondsPerKm: number;
    currentStreak: number;
    longestStreak: number;
    runsThisWeek: number;
    distanceThisWeekMeters: number;
    distanceThisMonthMeters: number;
    distanceThisYearMeters: number;
  };
  personalRecords: {
    fastest1k: number | null;
    fastest5k: number | null;
    fastest10k: number | null;
    longestRunMeters: number | null;
    highestElevationMeters: number | null;
  };
}

export interface ApiRunCreated {
  id: string;
  status: string;
  startedAt: string;
  title: string;
}

export interface ApiTrackPointsResponse {
  acceptedCount: number;
  totalBatch: number;
  lastSequence: number;
}

export interface ApiFinishedRun {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  distanceMeters: number;
  durationSeconds: number;
  movingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  calories: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiRunsResponse {
  data: ApiRunSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
