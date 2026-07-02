"use client";

import { OnboardingState } from "@/types";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

const ROLE_LABELS: Record<string, string> = {
  sre:          "Site Reliability Engineer",
  team_lead:    "Team Lead",
  individual:   "Individual Developer",
  student:      "Student / Researcher",
};

const GOAL_LABELS: Record<string, string> = {
  debug_faster:  "Debug production issues faster",
  monitor_team:  "Monitor team services",
  learn_errors:  "Understand errors deeply",
  thesis_demo:   "Thesis / demo project",
};

interface Props {
  state:      OnboardingState;
  loading:    boolean;
  onSubmit:   () => void;
  onBack:     () => void;
}

export default function StepComplete({ state, loading, onSubmit, onBack }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
          style={{
            background: "var(--accent-glow)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          You&apos;re all set, {state.name.split(" ")[0]}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Review your details before we create your workspace.
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Name",    value: state.name },
          { label: "Email",   value: state.email },
          { label: "Role",    value: ROLE_LABELS[state.role] ?? state.role },
          { label: "Goal",    value: GOAL_LABELS[state.goal] ?? state.goal },
          ...(state.company
            ? [{ label: "Company", value: state.company }]
            : []),
        ].map((row, i, arr) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 16px",
              borderBottom:
                i < arr.length - 1
                  ? "1px solid var(--border-subtle)"
                  : "none",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                fontWeight: 500,
                textAlign: "right",
                maxWidth: "60%",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div
        className="accent-line"
        style={{ paddingLeft: 12 }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          → Your workspace will be provisioned instantly<br />
          → You&apos;ll land on the analysis dashboard<br />
          → Paste your first stack trace to get started
        </p>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={loading}
          style={{ flex: 1 }}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={loading}
          style={{ flex: 2, padding: "12px" }}
        >
          {loading ? <ButtonSpinner /> : null}
          {loading ? "Creating workspace..." : "Launch TraceAgent"}
        </button>
      </div>
    </div>
  );
}