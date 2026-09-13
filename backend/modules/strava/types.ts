export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
  scope: string;
}

export interface StravaRefreshResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
}

export interface StravaAthlete {
  id: number;
  resource_state: number;
  firstname: string | null;
  lastname: string | null;
  profile_medium: string | null;
  profile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: string | null;
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
}

export interface StravaSummaryActivity {
  id: number;
  resource_state: number;
  external_id: string | null;
  upload_id: number | null;
  athlete: { id: number; resource_state: number };
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: number[] | null;
  end_latlng: number[] | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  total_photo_count: number;
  map: { id: string; polyline: string | null; resource_state: number };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  workout_type: number | null;
  upload_id_str: string | null;
  average_speed: number;
  max_speed: number;
  has_kudoed: boolean;
  hide_from_home: boolean;
  gear_id: string | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  calories: number | null;
  device_name: string | null;
  elev_high: number | null;
  elev_low: number | null;
}

export interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  updates: Record<string, string>;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

export interface NormalizedRun {
  stravaActivityId: string;
  name: string;
  activityType: string;
  sportType: string;
  startedAt: Date;
  startedAtLocal: Date;
  timezone: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elapsedTimeSeconds: number;
  elevationGainMeters: number;
  averageSpeedMps: number;
  maxSpeedMps: number;
  averagePaceSecondsPerKm: number;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
  calories: number;
  trainer: boolean;
  commute: boolean;
  private: boolean;
  stravaUrl: string;
}

export interface StravaConnectionInfo {
  connected: boolean;
  athlete: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileUrl: string | null;
  } | null;
  lastSyncedAt: string | null;
  syncStatus: string;
}
