"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { dashboardApi } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayCount      { date: string; count: number; }
interface StatusCount   { status: string; label: string; count: number; color: string; }
interface ServiceCount  { service: string; total: number; failures: number; }

interface Analytics {
  incidents_over_time:  DayCount[];
  status_breakdown:     StatusCount[];
  top_services:         ServiceCount[];
  total:                number;
  analyzed:             number;
  failed:               number;
  pending:              number;
  busiest_day:          string | null;
  most_failing_service: string | null;
}

// ── Shared chart theme ────────────────────────────────────────────────────────

const CHART_STYLE = {
  background:  "transparent",
  fontFamily:  "var(--font-mono)",
  fontSize:    11,
};

const TOOLTIP_STYLE = {
  background:   "#1a1a1a",
  border:       "1px solid #262626",
  borderRadius: 8,
  fontFamily:   "var(--font-mono)",
  fontSize:     12,
  color:        "#e5e5e5",
};

function ChartCard({
  title, subtitle, children, minHeight = 220,
}: {
  title: string; subtitle?: string; children: React.ReactNode; minHeight?: number;
}) {
  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div
        style={{
          padding:      "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <p style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.68rem",
          color:         "var(--text-muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom:  subtitle ? 3 : 0,
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ padding: "20px", minHeight }}>
        {children}
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({
  label, value, color,
}: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      padding:      "14px 18px",
      borderRadius: "var(--radius-lg)",
      background:   "var(--bg-elevated)",
      border:       "1px solid var(--border-default)",
      flex:         1,
      minWidth:     120,
    }}>
      <p style={{
        fontFamily:    "var(--font-mono)",
        fontSize:      "0.65rem",
        color:         "var(--text-muted)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom:  6,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-display)",
        fontSize:   "1.6rem",
        fontWeight: 800,
        color:      color ?? "var(--text-primary)",
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 220 }: { h?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height: h, borderRadius: "var(--radius-lg)" }}
    />
  );
}

// ── Custom tooltip for area chart ─────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const fmt = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: "8px 12px" }}>
      <p style={{ color: "#6b7280", marginBottom: 4, fontSize: 11 }}>{fmt}</p>
      <p style={{ color: "#f5a623", fontWeight: 700 }}>
        {payload[0].value} incident{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Custom tooltip for bar chart ──────────────────────────────────────────────

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: "8px 12px" }}>
      <p style={{ color: "#6b7280", marginBottom: 4, fontSize: 11 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill, marginBottom: 2 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ── Custom tooltip for pie chart ──────────────────────────────────────────────

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: "8px 12px" }}>
      <p style={{ color: d.color, fontWeight: 700 }}>{d.label}</p>
      <p style={{ color: "#e5e5e5" }}>{d.count} incidents</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.analytics()
      .then(setData)
      .catch((e) => setError(e?.message ?? "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  // Shorten service names for bar chart labels
  function shortName(s: string) {
    return s.length > 18 ? s.slice(0, 16) + "…" : s;
  }

  // Format date label on X axis
  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div>
        <p style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.72rem",
          color:         "var(--accent)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom:  6,
        }}>
          Workspace Intelligence
        </p>
        <h1 style={{
          fontFamily:   "var(--font-display)",
          fontSize:     "1.75rem",
          fontWeight:   800,
          marginBottom: 4,
        }}>
          Analytics
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Incident trends, service health, and pipeline performance across your workspace.
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding:      "14px 18px",
          borderRadius: "var(--radius-md)",
          background:   "rgba(239,68,68,0.08)",
          border:       "1px solid rgba(239,68,68,0.2)",
          color:        "var(--status-error)",
          fontFamily:   "var(--font-mono)",
          fontSize:     "0.82rem",
        }}>
          {error}
        </div>
      )}

      {/* ── Summary pills ── */}
      {loading ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[1,2,3,4].map(i => <Skeleton key={i} h={80} />)}
        </div>
      ) : data && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatPill label="Total Incidents" value={data.total} />
          <StatPill label="Analyzed"        value={data.analyzed} color="#10b981" />
          <StatPill label="Failed"          value={data.failed}   color="#ef4444" />
          <StatPill label="Success Rate"
            value={data.total > 0 ? `${Math.round(data.analyzed / data.total * 100)}%` : "—"}
            color="#f5a623"
          />
        </div>
      )}

      {/* ── Row 1: Area chart (incidents over time) ── */}
      {loading ? <Skeleton h={260} /> : data && (
        <ChartCard
          title="Incidents Over Time"
          subtitle="Last 14 days"
          minHeight={220}
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.incidents_over_time} style={CHART_STYLE}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f5a623" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f5a623" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f5a623"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={{ fill: "#f5a623", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#f5a623" }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Busiest day callout */}
          {data.busiest_day && (
            <p style={{
              fontFamily:  "var(--font-mono)",
              fontSize:    "0.7rem",
              color:       "var(--text-muted)",
              marginTop:   12,
              textAlign:   "right",
            }}>
              Peak day:{" "}
              <span style={{ color: "var(--accent)" }}>
                {new Date(data.busiest_day).toLocaleDateString(undefined, {
                  weekday: "short", month: "short", day: "numeric",
                })}
              </span>
            </p>
          )}
        </ChartCard>
      )}

      {/* ── Row 2: Bar chart + Pie chart side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Status breakdown — Pie */}
        {loading ? <Skeleton h={280} /> : data && (
          <ChartCard title="Status Breakdown" minHeight={240}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.status_breakdown}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.status_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{
              display:   "flex",
              flexWrap:  "wrap",
              gap:       "6px 14px",
              marginTop: 8,
            }}>
              {data.status_breakdown.map((s) => (
                <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)",
                  }}>
                    {s.label} ({s.count})
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Top services — horizontal bar */}
        {loading ? <Skeleton h={280} /> : data && (
          <ChartCard title="Top Services" subtitle="By incident volume" minHeight={240}>
            {data.top_services.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, data.top_services.length * 36)}>
                <BarChart
                  data={data.top_services.map(s => ({
                    ...s,
                    service: shortName(s.service),
                  }))}
                  layout="vertical"
                  style={CHART_STYLE}
                  barCategoryGap="25%"
                >
                  <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="service"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="total"    name="Total"    fill="#f5a623" radius={[0,3,3,0]} />
                  <Bar dataKey="failures" name="Failures" fill="#ef4444" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Most failing callout */}
            {data.most_failing_service && (
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "0.7rem",
                color:      "var(--text-muted)",
                marginTop:  12,
              }}>
                Most failures:{" "}
                <span style={{ color: "#ef4444" }}>
                  {data.most_failing_service}
                </span>
              </p>
            )}
          </ChartCard>
        )}
      </div>

      {/* ── Row 3: Service health table ── */}
      {loading ? <Skeleton h={180} /> : data && data.top_services.length > 0 && (
        <ChartCard title="Service Health" subtitle="Failure rate per service">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Header row */}
            <div style={{
              display:       "grid",
              gridTemplateColumns: "1fr 80px 80px 100px",
              padding:       "6px 0 10px",
              borderBottom:  "1px solid var(--border-subtle)",
              marginBottom:  4,
            }}>
              {["Service", "Total", "Failed", "Health"].map(h => (
                <span key={h} style={{
                  fontFamily:    "var(--font-mono)",
                  fontSize:      "0.65rem",
                  color:         "var(--text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {h}
                </span>
              ))}
            </div>

            {data.top_services.map((svc, i) => {
              const rate      = svc.total > 0
                ? Math.round((1 - svc.failures / svc.total) * 100)
                : 100;
              const barColor  = rate >= 90 ? "#10b981" : rate >= 70 ? "#f59e0b" : "#ef4444";

              return (
                <div
                  key={svc.service}
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "1fr 80px 80px 100px",
                    padding:             "10px 0",
                    borderBottom:        i < data.top_services.length - 1
                      ? "1px solid var(--border-subtle)" : "none",
                    alignItems:          "center",
                  }}
                >
                  <span style={{
                    fontFamily:   "var(--font-mono)",
                    fontSize:     "0.8rem",
                    color:        "var(--text-primary)",
                    overflow:     "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:   "nowrap",
                    paddingRight: 12,
                  }}>
                    {svc.service}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)",
                  }}>
                    {svc.total}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.8rem",
                    color: svc.failures > 0 ? "#ef4444" : "var(--text-muted)",
                  }}>
                    {svc.failures}
                  </span>
                  {/* Health bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      flex: 1, height: 5, borderRadius: 99,
                      background: "var(--bg-overlay)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width:        `${rate}%`,
                        height:       "100%",
                        borderRadius: 99,
                        background:   barColor,
                        transition:   "width 0.6s ease",
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: barColor,
                      minWidth: 34, textAlign: "right",
                    }}>
                      {rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

    </div>
  );
}