import { authHeader } from "./auth";
import {
  Incident,
  IncidentSubmitPayload,
  PaginatedResponse,
  DashboardStats,
  User,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Base Fetcher ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ?? body?.error;
    const message = Array.isArray(detail)
      ? detail.map((item: { msg?: string }) => item.msg ?? JSON.stringify(item)).join(", ")
      : detail;
    throw new Error(message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Base Fetcher (raw Response — for file downloads) ──────────────────────────

async function requestRaw(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeader(),          // ← Bearer token, same as every other call
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body?.detail ?? body?.error;
    const message = Array.isArray(detail)
      ? detail.map((item: { msg?: string }) => item.msg ?? JSON.stringify(item)).join(", ")
      : detail;
    throw new Error(message ?? `HTTP ${res.status}`);
  }

  return res;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    goal: string;
    company?: string;
  }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<User>("/auth/me"),
};

// ── Incidents ─────────────────────────────────────────────────────────────────

export const incidentApi = {
  submit: (payload: IncidentSubmitPayload) =>
    request<{ message: string; log_id: string }>("/incidents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  list: (params?: { page?: number; page_size?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page)      qs.set("page",      String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.status)    qs.set("status",    params.status);
    return request<PaginatedResponse<Incident>>(`/incidents?${qs}`);
  },

  get: (id: string) =>
    request<Incident>(`/incidents/${id}`),

  delete: (id: string) =>
    request<{ message: string }>(`/incidents/${id}`, { method: "DELETE" }),

  // Returns the raw Response so the caller can stream it as a Blob download
  export: (id: string, format: "pdf" | "markdown") =>
    requestRaw(`/incidents/${id}/export?format=${format}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => request<DashboardStats>("/dashboard/stats"),
};

// ── Workspaces ────────────────────────────────────────────────────────────────

export const workspaceApi = {
  list: () => request<{ workspace_id: string; created_at: string }[]>("/workspaces"),
};