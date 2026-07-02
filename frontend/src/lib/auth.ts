import { User } from "@/types";

const TOKEN_KEY = "trace_agent_token";
const USER_KEY  = "trace_agent_user";

// ── Token ─────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── User ──────────────────────────────────────────────────────────────────────

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ── Session ───────────────────────────────────────────────────────────────────

export function clearSession(): void {
  removeToken();
  removeStoredUser();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Auth Header ───────────────────────────────────────────────────────────────

export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}