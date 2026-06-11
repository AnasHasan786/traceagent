import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IncidentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date Formatting ───────────────────────────────────────────────────────────

/**
 * Ensures a date string is treated as UTC.
 * MongoDB/Python timestamps often come without the trailing "Z",
 * which makes JS Date() parse them as local time instead of UTC.
 * e.g. "2026-06-10T14:19:01" → "2026-06-10T14:19:01Z"
 */
function toUTCDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  // Already has timezone info (Z or +offset) — leave as-is
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateStr)) return new Date(dateStr);
  // No timezone suffix → treat as UTC
  return new Date(dateStr + "Z");
}

export function formatDate(dateStr: string): string {
  const date = toUTCDate(dateStr);
  if (isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(dateStr: string): string {
  const date = toUTCDate(dateStr);
  if (isNaN(date.getTime())) return "unknown";

  const now  = Date.now();
  const then = date.getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff <  0)      return "just now";          // clock skew guard
  if (diff <  60)     return "just now";
  if (diff <  3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff <  86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff <  604800) return `${Math.floor(diff / 86400)}d ago`;
  // Older than a week — show the actual date instead
  return new Intl.DateTimeFormat(undefined, {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  }).format(date);
}

// ── Status Helpers ────────────────────────────────────────────────────────────

export function getStatusBadgeClass(status: IncidentStatus): string {
  switch (status) {
    case "analyzed":            return "badge badge-analyzed";
    case "pending":             return "badge badge-pending";
    case "failed":
    case "permanently_failed":  return "badge badge-failed";
    case "quota_exceeded":
    case "configuration_error": return "badge badge-warning";
    default:                    return "badge badge-pending";
  }
}

export function getStatusLabel(status: IncidentStatus): string {
  switch (status) {
    case "analyzed":            return "Analyzed";
    case "pending":             return "Pending";
    case "failed":              return "Failed";
    case "permanently_failed":  return "Dead";
    case "quota_exceeded":      return "Quota";
    case "configuration_error": return "Config Error";
    default:                    return status;
  }
}

// ── String Helpers ────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}