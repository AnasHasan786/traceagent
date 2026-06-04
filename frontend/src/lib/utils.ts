import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IncidentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date Formatting ───────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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