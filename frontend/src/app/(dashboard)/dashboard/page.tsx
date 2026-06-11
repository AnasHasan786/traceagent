"use client";

import { useAuth } from "@/hooks/useAuth";
import { useIncidents, useDashboardStats } from "@/hooks/useIncidents";
import StatCard from "@/components/dashboard/StatCard";
import RecentIncidents from "@/components/dashboard/RecentIncidents";
import Link from "next/link";

export default function DashboardPage() {
  const { user }                          = useAuth();
  const { stats, loading: statsLoading }  = useDashboardStats();
  const { incidents, loading: incLoading} = useIncidents({ page: 1, page_size: 8 });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page header ── */}
      <div
        style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            16,
        }}
      >
        <div>
          <p
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.72rem",
              color:         "var(--accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom:  6,
            }}
          >
            {greeting}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize:   "1.75rem",
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            {`${user?.name?.split(" ")[0] ?? "Welcome"}'s Workspace`}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {`Here's what's happening in your incident pipeline.`}
          </p>
        </div>

        <Link
          href="/analyze"
          className="btn btn-primary"
          style={{ padding: "10px 20px" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Analysis
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div
        className="stagger"
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap:                 16,
        }}
      >
        <StatCard
          label="Total Incidents"
          value={statsLoading ? "—" : (stats?.total_incidents ?? 0)}
          sub="All time"
          accent={false}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <StatCard
          label="Analyzed"
          value={statsLoading ? "—" : (stats?.analyzed ?? 0)}
          sub="Successfully processed"
          accent
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={statsLoading ? "—" : (stats?.pending ?? 0)}
          sub="In queue"
          accent={false}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <StatCard
          label="Success Rate"
          value={
            statsLoading
              ? "—"
              : `${stats?.success_rate?.toFixed(0) ?? 0}%`
          }
          sub="Analyzed vs total"
          accent={false}
          trend={
            stats?.success_rate
              ? { value: Math.round(stats.success_rate - 80), label: "vs avg" }
              : undefined
          }
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>

      {/* ── Quick actions ── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap:                 12,
        }}
      >
        {[
          {
            href:  "/analyze",
            title: "Analyze Trace",
            desc:  "Paste a new stack trace for instant AI diagnosis.",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            href:  "/history",
            title: "Browse History",
            desc:  "Search and filter all past incidents.",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3.05 11a9 9 0 1 0 .5-3M3 5v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
          },
          {
            href:  "/settings",
            title: "Settings",
            desc:  "Manage your workspace and preferences.",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ),
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="card card-clickable"
            style={{
              textDecoration: "none",
              display:        "flex",
              alignItems:     "flex-start",
              gap:            12,
              padding:        "16px",
            }}
          >
            <div
              style={{
                color:          "var(--accent)",
                background:     "var(--accent-glow)",
                border:         "1px solid rgba(245,158,11,0.2)",
                borderRadius:   "var(--radius-md)",
                width:          36,
                height:         36,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
              }}
            >
              {action.icon}
            </div>
            <div>
              <p
                style={{
                  fontFamily:  "var(--font-display)",
                  fontWeight:  600,
                  fontSize:    "0.875rem",
                  marginBottom: 3,
                  color:       "var(--text-primary)",
                }}
              >
                {action.title}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {action.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent incidents ── */}
      <RecentIncidents incidents={incidents} loading={incLoading} />

      {/* ── Pipeline status strip ── */}
      <div
        style={{
          display:       "flex",
          alignItems:    "center",
          gap:           10,
          padding:       "12px 16px",
          borderRadius:  "var(--radius-md)",
          background:    "var(--bg-surface)",
          border:        "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            width:        8,
            height:       8,
            borderRadius: "50%",
            background:   "var(--status-success)",
            flexShrink:   0,
            animation:    "pulse-accent 2s infinite",
          }}
        />
        <span
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.72rem",
            color:         "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          PIPELINE ACTIVE · SQS CONNECTED · GROQ INFERENCE ENGINE ·{" "}
          <span style={{ color: "var(--status-success)" }}>ALL SYSTEMS OPERATIONAL</span>
        </span>
      </div>
    </div>
  );
}