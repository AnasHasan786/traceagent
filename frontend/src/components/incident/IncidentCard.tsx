"use client";

import Link from "next/link";
import { Incident } from "@/types";
import {
  getStatusBadgeClass,
  getStatusLabel,
  formatRelative,
  formatDate,
  truncate,
} from "@/lib/utils";

interface Props {
  incident: Incident;
}

export default function IncidentCard({ incident }: Props) {
  const firstLine = incident.raw_log.split("\n")[0].trim();

  return (
    <Link href={`/incident/${incident.id}`} style={{ textDecoration: "none" }}>
      <div
        className="card card-clickable animate-fade-in"
        style={{ padding: "16px 20px" }}
      >
        <div
          style={{
            display:        "flex",
            alignItems:     "flex-start",
            justifyContent: "space-between",
            gap:            12,
            marginBottom:   10,
          }}
        >
          {/* Left */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {/* Service name */}
            <div
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         8,
                marginBottom: 5,
              }}
            >
              <div
                style={{
                  width:        8,
                  height:       8,
                  borderRadius: "50%",
                  flexShrink:   0,
                  background:
                    incident.status === "analyzed"
                      ? "var(--status-success)"
                      : incident.status === "pending"
                      ? "var(--status-pending)"
                      : "var(--status-error)",
                }}
              />
              <p
                style={{
                  fontFamily:   "var(--font-display)",
                  fontWeight:   700,
                  fontSize:     "0.9rem",
                  color:        "var(--text-primary)",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                }}
              >
                {incident.service_name}
              </p>
            </div>

            {/* First log line */}
            <p
              style={{
                fontFamily:   "var(--font-mono)",
                fontSize:     "0.75rem",
                color:        "var(--text-muted)",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}
            >
              {truncate(firstLine, 80)}
            </p>
          </div>

          {/* Right — badge + time */}
          <div
            style={{
              display:       "flex",
              flexDirection: "column",
              alignItems:    "flex-end",
              gap:           6,
              flexShrink:    0,
            }}
          >
            <span className={getStatusBadgeClass(incident.status)}>
              {getStatusLabel(incident.status)}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "0.68rem",
                color:      "var(--text-muted)",
              }}
            >
              {formatRelative(incident.created_at)}
            </span>
          </div>
        </div>

        {/* Analysis preview (if analyzed) */}
        {incident.status === "analyzed" && incident.root_cause_analysis && (
          <div
            style={{
              padding:      "10px 12px",
              borderRadius: "var(--radius-md)",
              background:   "var(--bg-elevated)",
              border:       "1px solid var(--border-subtle)",
              marginTop:    4,
            }}
          >
            <p
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.65rem",
                color:         "var(--accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom:  4,
              }}
            >
              Root Cause
            </p>
            <p
              style={{
                fontSize:   "0.8rem",
                color:      "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {truncate(incident.root_cause_analysis, 120)}
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            marginTop:      10,
          }}
        >
          <span
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.65rem",
              color:         "var(--text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {formatDate(incident.created_at)}
          </span>
          <span
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.65rem",
              color:         "var(--text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {incident.raw_log.length.toLocaleString()} chars →
          </span>
        </div>
      </div>
    </Link>
  );
}