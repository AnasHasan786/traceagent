"use client";

interface Props {
  rootCause:     string;
  actionableFix: string;
}

// ── Smart text renderer ───────────────────────────────────────────────────────
// Handles two cases:
//   1. LLM already used \n between steps  → split on newlines
//   2. LLM jammed everything on one line  → split on "1) ... 2) ... N) ..."

function parseSteps(text: string): string[] {
  // If text already has real newlines with content, use them
  const byNewline = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  // Otherwise split on numbered patterns: "1)" "2." "Step 1:" etc.
  const byNumber = text
    .split(/(?=^[1-9][\)\.]\s)/m)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byNumber.length > 1) return byNumber;

  // Fallback: return as single block
  return [text];
}

function isNumberedStep(line: string): boolean {
  return /^[1-9][\)\.]\s/.test(line);
}

function TextBlock({ text, accent }: { text: string; accent: string }) {
  const parts = parseSteps(text);
  const hasSteps = parts.length > 1 && parts.some(isNumberedStep);

  if (!hasSteps) {
    // Plain prose — just render paragraphs
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {parts.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize:   "0.88rem",
              color:      "var(--text-primary)",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {para}
          </p>
        ))}
      </div>
    );
  }

  // Numbered steps — render each as a distinct row
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {parts.map((step, i) => {
        const numbered = isNumberedStep(step);
        // Strip the leading "1) " or "1. " prefix so we can render it separately
        const numMatch = step.match(/^(\d+[\)\.]\s*)/);
        const num      = numMatch ? numMatch[1].replace(/\s+$/, "") : null;
        const body     = numMatch ? step.slice(numMatch[0].length) : step;

        if (!numbered) {
          // Intro sentence before the list starts
          return (
            <p
              key={i}
              style={{
                fontSize:     "0.88rem",
                color:        "var(--text-primary)",
                lineHeight:   1.8,
                marginBottom: 4,
              }}
            >
              {step}
            </p>
          );
        }

        return (
          <div
            key={i}
            style={{
              display:      "flex",
              alignItems:   "flex-start",
              gap:          12,
              padding:      "10px 14px",
              borderRadius: "var(--radius-md)",
              background:   "var(--bg-overlay)",
              border:       "1px solid var(--border-subtle)",
            }}
          >
            {/* Step number badge */}
            <span
              style={{
                flexShrink:     0,
                width:          22,
                height:         22,
                borderRadius:   "50%",
                background:     accent,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontFamily:     "var(--font-mono)",
                fontSize:       "0.65rem",
                fontWeight:     700,
                color:          "#000",
                marginTop:      2,
              }}
            >
              {num?.replace(/[).]/, "") ?? i + 1}
            </span>
            {/* Step text */}
            <p
              style={{
                fontSize:   "0.87rem",
                color:      "var(--text-primary)",
                lineHeight: 1.75,
                flex:       1,
              }}
            >
              {body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
            padding:    "18px 20px",
            background: "var(--bg-surface)",
          }}
        >
          <TextBlock text={rootCause} accent="rgba(239,68,68,0.85)" />
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
            padding:    "18px 20px",
            background: "var(--bg-surface)",
          }}
        >
          <TextBlock text={actionableFix} accent="rgba(16,185,129,0.85)" />
        </div>
      </div>
    </div>
  );
}