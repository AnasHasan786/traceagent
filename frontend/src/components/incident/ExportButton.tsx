"use client";

import { useState, useRef, useEffect } from "react";
import { incidentApi } from "@/lib/api";

interface Props {
  incidentId:  string;
  serviceName: string;
}

type Format = "pdf" | "markdown";

export default function ExportButton({ incidentId, serviceName }: Props) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState<Format | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const ref                   = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleExport(format: Format) {
    setLoading(format);
    setError(null);
    setOpen(false);

    try {
      // Uses the same authHeader() as every other API call — no 403
      const res  = await incidentApi.export(incidentId, format);
      const blob = await res.blob();

      const ext      = format === "pdf" ? "pdf" : "md";
      const safeName = serviceName.toLowerCase().replace(/\s+/g, "-").slice(0, 60);
      const filename = `${safeName}-report.${ext}`;

      // Trigger browser download
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message ?? "Export failed");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* Trigger button */}
      <button
        onClick={() => !isLoading && setOpen((v) => !v)}
        disabled={isLoading}
        className="btn btn-ghost"
        style={{ padding: "8px 14px", fontSize: "0.8rem", gap: 6 }}
        title="Export report"
      >
        {isLoading ? (
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor"
              strokeWidth="1.5" strokeDasharray="40" strokeDashoffset="10"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <polyline points="7 10 12 15 17 10"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}

        {isLoading ? `Exporting ${loading?.toUpperCase()}…` : "Export"}

        {!isLoading && (
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            style={{
              transform:  open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              flexShrink: 0,
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Error toast */}
      {error && (
        <div style={{
          position:     "absolute",
          top:          "calc(100% + 8px)",
          right:        0,
          background:   "rgba(239,68,68,0.12)",
          border:       "1px solid rgba(239,68,68,0.3)",
          borderRadius: "var(--radius-md)",
          padding:      "8px 12px",
          fontSize:     "0.78rem",
          color:        "var(--status-error)",
          whiteSpace:   "nowrap",
          zIndex:       100,
        }}>
          {error}
        </div>
      )}

      {/* Dropdown */}
      {open && !isLoading && (
        <div style={{
          position:     "absolute",
          top:          "calc(100% + 6px)",
          right:        0,
          minWidth:     180,
          background:   "var(--bg-elevated)",
          border:       "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
          zIndex:       50,
          overflow:     "hidden",
        }}>

          {/* PDF */}
          <button
            onClick={() => handleExport("pdf")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 14px",
              background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left",
              borderBottom: "1px solid var(--border-subtle)",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "var(--radius-md)",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                  stroke="var(--status-error)" strokeWidth="1.5"/>
                <path d="M14 2v6h6" stroke="var(--status-error)"
                  strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)", fontWeight: 600,
                fontSize: "0.83rem", color: "var(--text-primary)", marginBottom: 1,
              }}>Export as PDF</p>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)",
              }}>Formatted report with dark theme</p>
            </div>
          </button>

          {/* Markdown */}
          <button
            onClick={() => handleExport("markdown")}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 14px",
              background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "var(--radius-md)",
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="16" height="10" viewBox="0 0 208 128" fill="none">
                <rect x="3" y="3" width="202" height="122" rx="12"
                  stroke="rgb(99,102,241)" strokeWidth="14" fill="none"/>
                <path d="M30 98V30l38 48 38-48v68M155 98V30M155 98l30-34M155 98l-30-34"
                  stroke="rgb(99,102,241)" strokeWidth="14"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p style={{
                fontFamily: "var(--font-display)", fontWeight: 600,
                fontSize: "0.83rem", color: "var(--text-primary)", marginBottom: 1,
              }}>Export as Markdown</p>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)",
              }}>Plain .md file for docs / GitHub</p>
            </div>
          </button>

        </div>
      )}
    </div>
  );
}