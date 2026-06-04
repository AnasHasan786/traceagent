"use client";

import { OnboardingState, UserRole } from "@/types";

interface Props {
  state:   OnboardingState;
  update:  (fields: Partial<OnboardingState>) => void;
  onNext:  () => void;
  onBack:  () => void;
}

const ROLES: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "sre",
    label: "Site Reliability Engineer",
    description: "I manage uptime, on-call incidents, and production systems.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "team_lead",
    label: "Team Lead / Engineering Manager",
    description: "I oversee a team and need visibility into recurring failures.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: "individual",
    label: "Individual Developer",
    description: "I debug my own services and want faster root cause analysis.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: "student",
    label: "Student / Researcher",
    description: "I'm exploring this for a thesis, project, or learning.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function StepRole({ state, update, onNext, onBack }: Props) {
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
          What best describes you?
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          This helps us tailor your experience.
        </p>
      </div>

      {/* Role options */}
      <div className="flex flex-col gap-3">
        {ROLES.map((role) => {
          const selected = state.role === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => update({ role: role.value })}
              className="card card-clickable text-left"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "14px 16px",
                borderColor: selected ? "var(--accent-dim)" : "var(--border-subtle)",
                background: selected ? "var(--accent-glow)" : "var(--bg-surface)",
                boxShadow: selected ? "var(--shadow-accent)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  color: selected ? "var(--accent)" : "var(--text-muted)",
                  marginTop: 2,
                  flexShrink: 0,
                  transition: "color 0.18s ease",
                }}
              >
                {role.icon}
              </div>

              {/* Text */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                    marginBottom: 3,
                  }}
                >
                  {role.label}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {role.description}
                </p>
              </div>

              {/* Check */}
              {selected && (
                <div
                  style={{
                    marginLeft: "auto",
                    flexShrink: 0,
                    color: "var(--accent)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Company (optional) */}
      <div className="flex flex-col gap-2">
        <label htmlFor="company">
          Company / Institution{" "}
          <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
            (optional)
          </span>
        </label>
        <input
          id="company"
          type="text"
          className="input"
          placeholder="e.g. Stripe, IIT Delhi, Freelance"
          value={state.company}
          onChange={(e) => update({ company: e.target.value })}
        />
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
          disabled={!state.role}
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