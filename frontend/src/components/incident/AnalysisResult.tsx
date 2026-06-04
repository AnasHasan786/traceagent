"use client";

interface Props {
  rootCause:     string;
  actionableFix: string;
}

export default function AnalysisResult({ rootCause, actionableFix }: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* Root cause */}
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          overflow:     "hidden",
          border:       "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:    "12px 18px",
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--border-subtle)",
            display:    "flex",
            alignItems: "center",
            gap:        8,
          }}
        >
          <div
            style={{
              width:          28,
              height:         28,
              borderRadius:   "var(--radius-md)",
              background:     "rgba(239,68,68,0.1)",
              border:         "1px solid rgba(239,68,68,0.2)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--status-error)" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="var(--status-error)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.72rem",
              color:         "var(--status-error)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight:    500,
            }}
          >
            Root Cause Analysis
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            padding:    "18px",
            background: "var(--bg-surface)",
          }}
        >
          <p
            style={{
              fontSize:   "0.9rem",
              color:      "var(--text-primary)",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {rootCause}
          </p>
        </div>
      </div>

      {/* Actionable fix */}
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          overflow:     "hidden",
          border:       "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:      "12px 18px",
            background:   "var(--bg-elevated)",
            borderBottom: "1px solid var(--border-subtle)",
            display:      "flex",
            alignItems:   "center",
            gap:          8,
          }}
        >
          <div
            style={{
              width:          28,
              height:         28,
              borderRadius:   "var(--radius-md)",
              background:     "rgba(16,185,129,0.1)",
              border:         "1px solid rgba(16,185,129,0.2)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4"
                stroke="var(--status-success)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="var(--status-success)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <p
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.72rem",
              color:         "var(--status-success)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight:    500,
            }}
          >
            Actionable Fix
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            padding:    "18px",
            background: "var(--bg-surface)",
          }}
        >
          <p
            style={{
              fontSize:   "0.9rem",
              color:      "var(--text-primary)",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {actionableFix}
          </p>
        </div>
      </div>
    </div>
  );
}