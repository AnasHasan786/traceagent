"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/shared/Logo";

// ── Animated grid background ──────────────────────────────────────────────────

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Radial glow — top center */}
      <div
        className="absolute"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Bottom right accent */}
      <div
        className="absolute"
        style={{
          bottom: "-10%",
          right: "-10%",
          width: "50vw",
          height: "50vh",
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── Scrolling code ticker ─────────────────────────────────────────────────────

const TICKER_LINES = [
  "NullPointerException at PaymentService.java:142",
  "FATAL: connection pool exhausted — postgres://prod-db:5432",
  "TypeError: Cannot read properties of undefined (reading 'userId')",
  "OutOfMemoryError: Java heap space — StripeWebhookHandler",
  "ECONNREFUSED 127.0.0.1:6379 — Redis connection failed",
  "UnhandledPromiseRejectionWarning: MongoNetworkError",
  "HTTP 503 — upstream connect error or disconnect/reset",
  "Segmentation fault (core dumped) — worker pid 4821",
  "django.db.utils.OperationalError: no such table: auth_user",
  "panic: runtime error: index out of range [3] with length 3",
];

function CodeTicker() {
  return (
    <div
      className="overflow-hidden w-full"
      style={{
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        padding: "10px 0",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "64px",
          animation: "ticker 30s linear infinite",
          width: "max-content",
        }}
      >
        {[...TICKER_LINES, ...TICKER_LINES].map((line, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: i % 3 === 0 ? "var(--status-error)" : "var(--text-muted)",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}
          >
            {line}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="card animate-fade-in"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg mb-4"
        style={{
          background: "var(--accent-glow)",
          border: "1px solid rgba(245,158,11,0.2)",
        }}
      >
        <span style={{ color: "var(--accent)" }}>{icon}</span>
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
        {description}
      </p>
    </div>
  );
}

// ── Stat item ─────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.25rem",
          fontWeight: 800,
          color: "var(--accent)",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <GridBackground />

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
          background: "rgba(13,14,17,0.8)",
        }}
      >
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost" style={{ padding: "8px 16px" }}>
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary" style={{ padding: "8px 18px" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="flex flex-col items-center justify-center text-center px-6 stagger"
        style={{ paddingTop: "160px", paddingBottom: "80px" }}
      >
        {/* Label pill */}
        <div
          className="animate-fade-in inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full"
          style={{
            background: "var(--accent-glow)",
            border: "1px solid rgba(245,158,11,0.25)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color: "var(--accent)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "pulse-accent 2s infinite",
              display: "inline-block",
            }}
          />
          Powered by Groq inference engine
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.6rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            maxWidth: 820,
            marginBottom: 24,
          }}
        >
          Stop guessing.
          <br />
          <span style={{ color: "var(--accent)" }}>Diagnose instantly.</span>
        </h1>

        {/* Subhead */}
        <p
          className="animate-fade-in"
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
            maxWidth: 540,
            lineHeight: 1.75,
            marginBottom: 40,
          }}
        >
          TraceAgent ingests your raw stack traces, queues them through an
          asynchronous pipeline, and returns plain-language root cause analysis
          with actionable fixes — in seconds.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in flex items-center gap-3 flex-wrap justify-center">
          <Link href="/register" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "0.95rem" }}>
            Start Analyzing Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/login" className="btn btn-ghost" style={{ padding: "12px 24px", fontSize: "0.95rem" }}>
            View Dashboard
          </Link>
        </div>
      </section>

      {/* ── Ticker ── */}
      <CodeTicker />

      {/* ── Stats ── */}
      <section
        className="mx-auto px-6 py-16"
        style={{ maxWidth: 900 }}
      >
        <div
          className="card stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
            textAlign: "center",
            padding: "40px 48px",
          }}
        >
          <Stat value="< 5s"   label="Average analysis time" />
          <Stat value="99.9%"  label="Queue delivery rate" />
          <Stat value="₹0"     label="Cost at demo scale" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto px-6 pb-20" style={{ maxWidth: 900 }}>
        <div className="accent-line mb-10">
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Architecture
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              fontWeight: 700,
            }}
          >
            Built for reliability
          </h2>
        </div>

        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <FeatureCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Async SQS Pipeline"
            description="Stack traces are decoupled from analysis via Amazon SQS, protecting your backend from burst failures and LLM rate limits."
          />
          <FeatureCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="Intelligent Retries"
            description="Per-minute throttle detection with exponential backoff. Messages re-queue automatically — zero manual intervention."
          />
          <FeatureCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="Full Incident History"
            description="Every trace is persisted to MongoDB Atlas with status tracking. Search, filter, and revisit any past incident instantly."
          />
          <FeatureCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Multi-Service Workspaces"
            description="Organise traces by service name and workspace. Perfect for teams running multiple microservices across environments."
          />
          <FeatureCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
            title="Actionable Fixes"
            description="Not just root cause — every analysis includes a concrete, code-level fix suggestion."
          />
          <FeatureCard
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 9l2 2-2 2M13 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="Monaco Trace Editor"
            description="Paste traces into an embedded VS Code-grade editor with syntax highlighting, line numbers, and full formatting support."
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Logo size="sm" />
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
          }}
        >
          Built with Next.js · FastAPI · Groq inference engine · MongoDB Atlas
        </p>
      </footer>
    </div>
  );
}