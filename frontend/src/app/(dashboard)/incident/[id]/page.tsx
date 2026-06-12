"use client";

import { use, useState } from "react";
import { useIncident } from "@/hooks/useIncidents";
import { useRouter } from "next/navigation";
import { incidentApi } from "@/lib/api";
import AnalysisResult from "@/components/incident/AnalysisResult";
import ExportButton from "@/components/incident/ExportButton";
import NotesTab from "@/components/incident/NotesTab";
import { SkeletonRows } from "@/components/shared/LoadingSpinner";
import {
  getStatusBadgeClass,
  getStatusLabel,
  formatDate,
  formatRelative,
} from "@/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";


const TraceEditor = dynamic(
  () => import("@/components/incident/TraceEditor"),
  { ssr: false }
);

// ── Raw log viewer ────────────────────────────────────────────────────────────

function RawLogPanel({ log }: { log: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = log.split("\n");

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--bg-elevated)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                stroke="var(--text-muted)"
                strokeWidth="1.5"
              />
              <path
                d="M14 2v6h6M9 13h6M9 17h4"
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Raw Stack Trace
          </p>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              padding: "1px 7px",
              borderRadius: 99,
            }}
          >
            {log.length.toLocaleString()} chars
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              padding: "1px 7px",
              borderRadius: 99,
            }}
          >
            {lines.length} lines
          </span>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="btn btn-ghost"
          style={{ padding: "5px 12px", fontSize: "0.75rem" }}
        >
          {expanded ? "Collapse" : "Expand"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Expanded: full editor */}
      {expanded && (
        <TraceEditor value={log} onChange={() => { }} height={280} />
      )}

      {/* Collapsed: preview */}
      {!expanded && (
        <div style={{ padding: "14px 18px", background: "var(--bg-surface)" }}>
          {lines.slice(0, 3).map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
                color: i === 0 ? "var(--text-secondary)" : "var(--text-muted)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                lineHeight: 1.6,
                marginBottom: i < 2 && lines.length > 1 ? 2 : 0,
              }}
            >
              {line || "\u00A0"}
            </p>
          ))}
          {lines.length > 3 && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                marginTop: 6,
                opacity: 0.6,
              }}
            >
              +{lines.length - 3} more lines — click Expand to view all
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Status banner ─────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: string }) {
  const configs: Record<string, {
    bg: string; border: string; color: string; icon: React.ReactNode; message: string;
  }> = {
    pending: {
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.2)",
      color: "var(--status-pending)",
      message: "This trace is queued and waiting for the background worker to pick it up.",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    failed: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      color: "var(--status-error)",
      message: "Analysis failed after all retry attempts. The raw log is preserved.",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    permanently_failed: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      color: "var(--status-error)",
      message: "Message exhausted all SQS delivery attempts and was dropped from the queue.",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    quota_exceeded: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      color: "var(--status-warning)",
      message: "Groq inference engine daily token quota was exhausted. Quota resets at midnight UTC (5:30 AM IST).",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    configuration_error: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      color: "var(--status-warning)",
      message: "IAM permissions is incorrect. Check your AWS setup.",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  };

  const config = configs[status];
  if (!config) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <span style={{ color: config.color, flexShrink: 0, marginTop: 1 }}>
        {config.icon}
      </span>
      <p style={{ fontSize: "0.85rem", color: config.color, lineHeight: 1.6 }}>
        {config.message}
      </p>
    </div>
  );
}

// ── Metadata row ──────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          color: "var(--text-secondary)",
          textAlign: "right",
          maxWidth: "60%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

type Tab = "analysis" | "notes";

function TabBar({
  active,
  onChange,
  noteCount,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  noteCount: number;
}) {
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "analysis", label: "Analysis" },
    { id: "notes",    label: "Notes", count: noteCount },
  ];

  return (
    <div
      style={{
        display:      "flex",
        gap:          0,
        borderBottom: "1px solid var(--border-subtle)",
        marginBottom: 4,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           6,
            padding:       "9px 18px",
            background:    "transparent",
            border:        "none",
            borderBottom:  active === tab.id
              ? "2px solid var(--accent)"
              : "2px solid transparent",
            marginBottom:  "-1px",
            cursor:        "pointer",
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color:         active === tab.id ? "var(--accent)" : "var(--text-muted)",
            transition:    "color 0.15s ease",
            whiteSpace:    "nowrap",
          }}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span
              style={{
                fontFamily:   "var(--font-mono)",
                fontSize:     "0.62rem",
                background:   active === tab.id
                  ? "rgba(245,166,35,0.15)"
                  : "var(--bg-elevated)",
                color:        active === tab.id ? "var(--accent)" : "var(--text-muted)",
                border:       `1px solid ${active === tab.id ? "rgba(245,166,35,0.3)" : "var(--border-subtle)"}`,
                borderRadius: 99,
                padding:      "1px 7px",
                transition:   "all 0.15s ease",
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }                       = use(params);
  const { incident, loading, error } = useIncident(id);
  const router                       = useRouter();
  const [deleting, setDeleting]      = useState(false);
  const [copyDone, setCopyDone]      = useState(false);
  const [activeTab, setActiveTab]    = useState<Tab>("analysis");

  async function handleDelete() {
    if (!confirm("Delete this incident? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await incidentApi.delete(id);
      router.push("/history");
    } catch {
      setDeleting(false);
    }
  }

  function handleCopy() {
    if (!incident) return;
    const text = [
      `Service: ${incident.service_name}`,
      `Status: ${incident.status}`,
      `Date: ${formatDate(incident.created_at)}`,
      "",
      "ROOT CAUSE:",
      incident.root_cause_analysis ?? "N/A",
      "",
      "ACTIONABLE FIX:",
      incident.actionable_fix ?? "N/A",
      "",
      "RAW LOG:",
      incident.raw_log,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="skeleton" style={{ height: 32, width: "40%" }} />
        <div className="card" style={{ padding: 24 }}>
          <SkeletonRows rows={6} />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !incident) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/history"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Back to History
        </Link>
        <div className="card" style={{ padding: "48px", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "1rem",
              marginBottom: 8,
            }}
          >
            Incident not found
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {error ?? "This incident may have been deleted."}
          </p>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href="/history"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-muted)")
          }
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          History
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 300,
          }}
        >
          {incident.service_name}
        </span>
      </div>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
                fontWeight: 800,
              }}
            >
              {incident.service_name}
            </h1>
            <span className={getStatusBadgeClass(incident.status)}>
              {getStatusLabel(incident.status)}
            </span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            {formatDate(incident.created_at)} · {formatRelative(incident.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCopy}
            className="btn btn-ghost"
            style={{ padding: "8px 14px", fontSize: "0.8rem" }}
          >
            {copyDone ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="var(--status-success)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
            {copyDone ? "Copied!" : "Copy Report"}
          </button>

          {incident.status === "analyzed" && (
            <ExportButton
              incidentId={incident.id}
              serviceName={incident.service_name}
            />
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-danger"
            style={{ padding: "8px 14px", fontSize: "0.8rem" }}
          >
            {deleting ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.7s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="40" strokeDashoffset="10" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* ── Status banner ── */}
      {incident.status !== "analyzed" && (
        <StatusBanner status={incident.status} />
      )}

      {/* ── Main grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left — tabbed content */}
        <div className="flex flex-col gap-4">

          {/* Tab bar */}
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            noteCount={incident.notes?.length ?? 0}
          />

          {/* Analysis tab */}
          {activeTab === "analysis" && (
            <div className="flex flex-col gap-5">
              {incident.status === "analyzed" &&
                incident.root_cause_analysis &&
                incident.actionable_fix ? (
                <AnalysisResult
                  rootCause={incident.root_cause_analysis}
                  actionableFix={incident.actionable_fix}
                />
              ) : (
                incident.status !== "analyzed" && (
                  <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        marginBottom: 6,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Analysis unavailable
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      This incident did not complete successfully. The raw log is preserved below.
                    </p>
                  </div>
                )
              )}
              <RawLogPanel log={incident.raw_log} />
            </div>
          )}

          {/* Notes tab */}
          {activeTab === "notes" && (
            <NotesTab
              incidentId={incident.id}
              initialNotes={incident.notes ?? []}
            />
          )}
        </div>

        {/* Right — metadata (always visible regardless of tab) */}
        <div className="flex flex-col gap-4">

          <div className="card" style={{ padding: "16px 18px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Metadata
            </p>
            <div>
              <MetaRow label="Service"   value={incident.service_name} />
              <MetaRow label="Status"    value={getStatusLabel(incident.status)} />
              <MetaRow label="Workspace" value={incident.workspace_id} />
              <MetaRow label="Log ID"    value={incident.id.slice(0, 16) + "..."} />
              <MetaRow label="Created"   value={formatDate(incident.created_at)} />
            </div>
          </div>

          <div className="card" style={{ padding: "16px 18px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Token Stats
            </p>
            <div>
              <MetaRow
                label="Input chars"
                value={incident.raw_log.length.toLocaleString()}
              />
              <MetaRow
                label="Est. tokens"
                value={Math.ceil(incident.raw_log.length / 4).toLocaleString()}
              />
              {incident.root_cause_analysis && (
                <MetaRow
                  label="Analysis chars"
                  value={(
                    incident.root_cause_analysis.length +
                    (incident.actionable_fix?.length ?? 0)
                  ).toLocaleString()}
                />
              )}
            </div>
          </div>

          {incident.status !== "pending" && (
            <Link
              href="/analyze"
              className="btn btn-ghost"
              style={{ justifyContent: "center", fontSize: "0.82rem", padding: "10px" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Analyze another trace
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}