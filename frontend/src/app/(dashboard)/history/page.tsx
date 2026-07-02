"use client";

import { useState, useMemo } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import IncidentCard from "@/components/incident/IncidentCard";
import { SkeletonRows } from "@/components/shared/LoadingSpinner";

// ── Filter bar ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All",        value: ""                  },
  { label: "Analyzed",   value: "analyzed"          },
  { label: "Pending",    value: "pending"           },
  { label: "Failed",     value: "failed"            },
  { label: "Dead",       value: "permanently_failed"},
];

function FilterPill({
  label,
  active,
  onClick,
}: {
  label:   string;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:       "5px 14px",
        borderRadius:  99,
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.72rem",
        letterSpacing: "0.04em",
        cursor:        "pointer",
        border:        `1px solid ${active ? "var(--accent-dim)" : "var(--border-default)"}`,
        background:    active ? "var(--accent-glow)" : "transparent",
        color:         active ? "var(--accent)"      : "var(--text-muted)",
        transition:    "all 0.15s ease",
        whiteSpace:    "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      style={{
        padding:   "60px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width:          56,
          height:         56,
          borderRadius:   "var(--radius-xl)",
          background:     "var(--bg-elevated)",
          border:         "1px solid var(--border-subtle)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          margin:         "0 auto 16px",
          color:          "var(--text-muted)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p
        style={{
          fontFamily:   "var(--font-display)",
          fontWeight:   600,
          fontSize:     "0.95rem",
          marginBottom: 6,
        }}
      >
        {filtered ? "No matching incidents" : "No incidents yet"}
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
        {filtered
          ? "Try adjusting your search or filter."
          : "Submit your first stack trace to get started."}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("");
  const [page, setPage]           = useState(1);

  const { incidents, total, loading } = useIncidents({
    page,
    page_size: PAGE_SIZE,
    status:    status || undefined,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Client-side search filter on top of server-side status filter
  const filtered = useMemo(() => {
    if (!search.trim()) return incidents;
    const q = search.toLowerCase();
    return incidents.filter(
      (inc) =>
        inc.service_name.toLowerCase().includes(q) ||
        inc.raw_log.toLowerCase().includes(q) ||
        inc.root_cause_analysis?.toLowerCase().includes(q)
    );
  }, [incidents, search]);

  function handleStatusChange(val: string) {
    setStatus(val);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
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
          Incident Pipeline
        </p>
        <h1
          style={{
            fontFamily:   "var(--font-display)",
            fontSize:     "1.75rem",
            fontWeight:   800,
            marginBottom: 4,
          }}
        >
          History
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          All stack traces processed through your pipeline.
          {total > 0 && (
            <span
              style={{
                marginLeft:    8,
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.78rem",
                color:         "var(--accent)",
                background:    "var(--accent-glow)",
                border:        "1px solid rgba(245,158,11,0.2)",
                padding:       "1px 8px",
                borderRadius:  99,
              }}
            >
              {total} total
            </span>
          )}
        </p>
      </div>

      {/* ── Search + filters ── */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative" }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position:  "absolute",
              left:      12,
              top:       "50%",
              transform: "translateY(-50%)",
              color:     "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="input"
            placeholder="Search by service name, error message, or root cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36, fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position:   "absolute",
                right:      12,
                top:        "50%",
                transform:  "translateY(-50%)",
                background: "none",
                border:     "none",
                cursor:     "pointer",
                color:      "var(--text-muted)",
                display:    "flex",
                padding:    0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Status filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <FilterPill
              key={f.value}
              label={f.label}
              active={status === f.value}
              onClick={() => handleStatusChange(f.value)}
            />
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      {loading ? (
        <div className="card" style={{ padding: 24 }}>
          <SkeletonRows rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <EmptyState filtered={!!search || !!status} />
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger">
          {filtered.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && !loading && (
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "12px 0",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "0.72rem",
              color:      "var(--text-muted)",
            }}
          >
            Page {page} of {totalPages} · {total} incidents
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "7px 14px", fontSize: "0.8rem" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Prev
            </button>

            {/* Page numbers */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width:        32,
                      height:       32,
                      borderRadius: "var(--radius-md)",
                      fontFamily:   "var(--font-mono)",
                      fontSize:     "0.78rem",
                      border:       `1px solid ${p === page ? "var(--accent-dim)" : "var(--border-default)"}`,
                      background:   p === page ? "var(--accent-glow)" : "transparent",
                      color:        p === page ? "var(--accent)" : "var(--text-muted)",
                      cursor:       "pointer",
                      transition:   "all 0.15s ease",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "7px 14px", fontSize: "0.8rem" }}
            >
              Next
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}