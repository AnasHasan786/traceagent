"use client";

import { OnboardingState, UserGoal } from "@/types";

interface Props {
  state:   OnboardingState;
  update:  (fields: Partial<OnboardingState>) => void;
  onNext:  () => void;
  onBack:  () => void;
}

const GOALS: { value: UserGoal; label: string; description: string; tag: string }[] = [
  {
    value: "debug_faster",
    label: "Debug production issues faster",
    description: "Cut MTTR by getting instant root cause analysis on live stack traces.",
    tag: "Most popular",
  },
  {
    value: "monitor_team",
    label: "Monitor my team's services",
    description: "Centralise incident history across all microservices in one workspace.",
    tag: "Teams",
  },
  {
    value: "learn_errors",
    label: "Understand errors deeply",
    description: "Learn what causes common exceptions and how to prevent them.",
    tag: "Learning",
  },
  {
    value: "thesis_demo",
    label: "Thesis / demo project",
    description: "Showcase an end-to-end AI-powered async pipeline for evaluation.",
    tag: "Academic",
  },
];

export default function StepGoal({ state, update, onNext, onBack }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          What&apos;s your main goal?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          We&apos;ll optimise your dashboard view around this.
        </p>
      </div>

      {/* Goal options */}
      <div className="flex flex-col gap-3">
        {GOALS.map((goal) => {
          const selected = state.goal === goal.value;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => update({ goal: goal.value })}
              className="card card-clickable text-left"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderColor: selected ? "var(--accent-dim)" : "var(--border-subtle)",
                background: selected ? "var(--accent-glow)" : "var(--bg-surface)",
                boxShadow: selected ? "var(--shadow-accent)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2 mb-1">
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {goal.label}
                  </p>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: selected ? "var(--accent)" : "var(--text-muted)",
                      background: selected ? "var(--accent-glow)" : "var(--bg-overlay)",
                      border: `1px solid ${selected ? "rgba(245,158,11,0.3)" : "var(--border-subtle)"}`,
                      padding: "1px 7px",
                      borderRadius: 99,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {goal.tag}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {goal.description}
                </p>
              </div>

              {selected && (
                <div style={{ color: "var(--accent)", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          style={{ flex: 1 }}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!state.goal}
          style={{ flex: 2 }}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}