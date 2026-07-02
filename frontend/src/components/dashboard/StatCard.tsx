"use client";

interface StatCardProps {
  label:     string;
  value:     string | number;
  sub?:      string;
  accent?:   boolean;
  icon:      React.ReactNode;
  trend?:    { value: number; label: string };
}

export default function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  trend,
}: StatCardProps) {
  const positive = trend && trend.value >= 0;

  return (
    <div
      className="card"
      style={{
        borderColor: accent ? "var(--accent-dim)" : "var(--border-subtle)",
        background:  accent ? "var(--accent-glow)" : "var(--bg-surface)",
        boxShadow:   accent ? "var(--shadow-accent)" : "none",
        transition:  "all 0.2s ease",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          marginBottom:   16,
        }}
      >
        <p
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.7rem",
            color:         accent ? "var(--accent)" : "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </p>

        <div
          style={{
            width:          34,
            height:         34,
            borderRadius:   "var(--radius-md)",
            background:     accent ? "rgba(245,158,11,0.2)" : "var(--bg-elevated)",
            border:         `1px solid ${accent ? "rgba(245,158,11,0.3)" : "var(--border-subtle)"}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            color:          accent ? "var(--accent)" : "var(--text-secondary)",
            flexShrink:     0,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <p
        style={{
          fontFamily:  "var(--font-display)",
          fontSize:    "2rem",
          fontWeight:  800,
          lineHeight:  1,
          color:       accent ? "var(--accent)" : "var(--text-primary)",
          marginBottom: sub || trend ? 8 : 0,
        }}
      >
        {value}
      </p>

      {/* Sub + trend */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {sub && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
        {trend && (
          <span
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.72rem",
              color:         positive ? "var(--status-success)" : "var(--status-error)",
              background:    positive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border:        `1px solid ${positive ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              padding:       "1px 7px",
              borderRadius:  99,
            }}
          >
            {positive ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}