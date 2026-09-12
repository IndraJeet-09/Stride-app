import { getAccessToken } from "@/lib/auth/storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export async function getAuthToken(): Promise<string | null> {
  return getAccessToken();
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: { code: string; message: string } }> {
  try {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      return {
        error: {
          code: "UNAUTHENTICATED",
          message: "Please log in again",
        },
      };
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: result.error || {
          code: "HTTP_ERROR",
          message: `Request failed with status ${response.status}`,
        },
      };
    }

    return { data: result.data };
  } catch (e: any) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: e.message || "Failed to connect to backend server",
      },
    };
  }
}

export const StrideAPI = {
  getMe: () => apiRequest("/auth/me"),
  getDashboard: () => apiRequest("/dashboard"),
  getContributions: (year: number) => apiRequest(`/contributions?year=${year}`),
  getStats: () => apiRequest("/stats/overview"),

  startRun: (body: {
    clientRunId: string;
    startedAt?: string;
    timezone?: string;
    title?: string;
  }) => apiRequest("/runs", { method: "POST", body: JSON.stringify(body) }),

  getRuns: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sort?: "asc" | "desc";
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.sort) searchParams.set("sort", params.sort);
    const query = searchParams.toString();
    return apiRequest(`/runs${query ? `?${query}` : ""}`);
  },

  getRunDetail: (id: string) => apiRequest(`/runs/${id}`),

  pauseRun: (runId: string) =>
    apiRequest(`/runs/${runId}/pause`, { method: "POST" }),

  resumeRun: (runId: string) =>
    apiRequest(`/runs/${runId}/resume`, { method: "POST" }),

  finishRun: (runId: string, endedAt?: string) =>
    apiRequest(`/runs/${runId}/finish`, {
      method: "POST",
      body: JSON.stringify({ endedAt }),
    }),

  discardRun: (runId: string) =>
    apiRequest(`/runs/${runId}/discard`, { method: "POST" }),

  ingestTrackPoints: (runId: string, points: any[]) =>
    apiRequest(`/runs/${runId}/track-points`, {
      method: "POST",
      body: JSON.stringify({ points }),
    }),

  getPublicProfile: (username: string) =>
    apiRequest(`/users/${username}`),

  requestExport: () => apiRequest("/account/export"),
  requestDeletion: () =>
    apiRequest("/account/deletion", { method: "DELETE" }),
};
