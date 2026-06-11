"use client";

import Link from "next/link";
import { Incident } from "@/types";
import { getStatusBadgeClass, getStatusLabel, formatRelative, truncate } from "@/lib/utils";
import { SkeletonRows } from "@/components/shared/LoadingSpinner";

interface Props {
  incidents: Incident[];
  loading:   boolean;
}

export default function RecentIncidents({ incidents, loading }: Props) {
  // Always render latest-first regardless of what the parent passes in
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* Header */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "18px 20px",
          borderBottom:   "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily:   "var(--font-display)",
              fontWeight:   600,
              fontSize:     "0.95rem",
              marginBottom: 2,
            }}
          >
            Recent Incidents
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Latest stack traces processed by the pipeline
          </p>
        </div>
        <Link
          href="/history"
          style={{
            fontFamily:     "var(--font-mono)",
            fontSize:       "0.72rem",
            color:          "var(--accent)",
            textDecoration: "none",
            letterSpacing:  "0.04em",
          }}
        >
          View all →
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 0" }}>
        {loading ? (
          <div style={{ padding: "12px 20px" }}>
            <SkeletonRows rows={4} />
          </div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding:   "40px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width:          48,
                height:         48,
                borderRadius:   "var(--radius-lg)",
                background:     "var(--bg-elevated)",
                border:         "1px solid var(--border-subtle)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                margin:         "0 auto 12px",
                color:          "var(--text-muted)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h10M4 17h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p
              style={{
                fontFamily:   "var(--font-display)",
                fontWeight:   600,
                fontSize:     "0.875rem",
                marginBottom: 4,
              }}
            >
              No incidents yet
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Submit your first stack trace to get started
            </p>
          </div>
        ) : (
          sorted.map((inc, i) => (
            <Link
              key={inc.id}
              href={`/incident/${inc.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          14,
                  padding:      "12px 20px",
                  borderBottom: i < sorted.length - 1
                    ? "1px solid var(--border-subtle)"
                    : "none",
                  transition:   "background 0.15s ease",
                  cursor:       "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width:        8,
                    height:       8,
                    borderRadius: "50%",
                    flexShrink:   0,
                    background:
                      inc.status === "analyzed"
                        ? "var(--status-success)"
                        : inc.status === "pending"
                        ? "var(--status-pending)"
                        : "var(--status-error)",
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily:   "var(--font-display)",
                      fontWeight:   600,
                      fontSize:     "0.85rem",
                      color:        "var(--text-primary)",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                      marginBottom: 3,
                    }}
                  >
                    {inc.service_name}
                  </p>
                  <p
                    style={{
                      fontFamily:   "var(--font-mono)",
                      fontSize:     "0.72rem",
                      color:        "var(--text-muted)",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}
                  >
                    {truncate(inc.raw_log.split("\n")[0], 60)}
                  </p>
                </div>

                {/* Right side */}
                <div
                  style={{
                    display:       "flex",
                    flexDirection: "column",
                    alignItems:    "flex-end",
                    gap:           5,
                    flexShrink:    0,
                  }}
                >
                  <span className={getStatusBadgeClass(inc.status)}>
                    {getStatusLabel(inc.status)}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize:   "0.68rem",
                      color:      "var(--text-muted)",
                    }}
                  >
                    {formatRelative(inc.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}