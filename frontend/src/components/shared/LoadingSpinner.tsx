"use client";

import { cn } from "@/lib/utils";

// ── Spinner ───────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border",
  md: "w-6 h-6 border-2",
  lg: "w-9 h-9 border-2",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full animate-spin",
        "border-transparent",
        spinnerSizes[size],
        className
      )}
      style={{
        borderTopColor: "var(--accent)",
        borderRightColor: "var(--accent)",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ── Full Page Loader ──────────────────────────────────────────────────────────

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Animated logo mark */}
      <div className="relative">
        <svg
          width="48"
          height="48"
          viewBox="0 0 38 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: "pulse-accent 2s ease infinite" }}
        >
          <path
            d="M19 2L35 11V27L19 36L3 27V11L19 2Z"
            stroke="var(--accent)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M11 15h5l2 4 4-8 2 4h3"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="26" r="1.5" fill="var(--accent)" />
        </svg>

        {/* Outer ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid var(--accent)",
            opacity: 0.25,
            transform: "scale(1.4)",
            animation: "pulse-accent 2s ease infinite",
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ── Inline Skeleton Rows ──────────────────────────────────────────────────────

interface SkeletonProps {
  rows?: number;
  className?: string;
}

export function SkeletonRows({ rows = 3, className }: SkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div
            className="skeleton"
            style={{
              height: 14,
              width: `${70 + (i % 3) * 10}%`,
            }}
          />
          <div
            className="skeleton"
            style={{
              height: 12,
              width: `${40 + (i % 2) * 20}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Button Spinner (inline inside buttons) ────────────────────────────────────

export function ButtonSpinner() {
  return <Spinner size="xs" />;
}