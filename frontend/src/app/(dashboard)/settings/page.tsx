"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/utils";

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title:       string;
  description?: string;
  children:    React.ReactNode;
}) {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "240px 1fr",
        gap:                 32,
        paddingBottom:       32,
        borderBottom:        "1px solid var(--border-subtle)",
      }}
    >
      <div>
        <h3
          style={{
            fontFamily:   "var(--font-display)",
            fontWeight:   600,
            fontSize:     "0.9rem",
            marginBottom: 6,
          }}
        >
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        position:     "fixed",
        bottom:       24,
        right:        24,
        padding:      "10px 18px",
        borderRadius: "var(--radius-md)",
        background:   "var(--bg-elevated)",
        border:       "1px solid var(--border-default)",
        boxShadow:    "var(--shadow-lg)",
        display:      "flex",
        alignItems:   "center",
        gap:          8,
        zIndex:       9999,
        fontFamily:   "var(--font-mono)",
        fontSize:     "0.78rem",
        color:        "var(--text-primary)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6L9 17l-5-5"
          stroke="var(--status-success)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  sre:        "Site Reliability Engineer",
  team_lead:  "Team Lead",
  individual: "Individual Developer",
  student:    "Student / Researcher",
};

const GOAL_LABELS: Record<string, string> = {
  debug_faster: "Debug production issues faster",
  monitor_team: "Monitor team services",
  learn_errors: "Understand errors deeply",
  thesis_demo:  "Thesis / demo project",
};

export default function SettingsPage() {
  const { user, logout }      = useAuth();
  const [toast, setToast]     = useState<string | null>(null);
  const [danger, setDanger]   = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleSave() {
    showToast("Settings saved successfully.");
  }

  function handleCopyId() {
    if (!user) return;
    navigator.clipboard.writeText(user.id).then(() =>
      showToast("User ID copied to clipboard.")
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">

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
          Workspace
        </p>
        <h1
          style={{
            fontFamily:   "var(--font-display)",
            fontSize:     "1.75rem",
            fontWeight:   800,
            marginBottom: 4,
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Manage your account, workspace preferences, and pipeline configuration.
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-8">

        {/* Profile */}
        <Section
          title="Profile"
          description="Your personal information and how you appear in the workspace."
        >
          <div className="flex flex-col gap-5">

            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width:          56,
                  height:         56,
                  borderRadius:   "50%",
                  background:     "var(--accent-glow)",
                  border:         "2px solid rgba(245,158,11,0.3)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  fontFamily:     "var(--font-display)",
                  fontWeight:     700,
                  fontSize:       "1.1rem",
                  color:          "var(--accent)",
                  flexShrink:     0,
                }}
              >
                {initials(user.name)}
              </div>
              <div>
                <p
                  style={{
                    fontFamily:   "var(--font-display)",
                    fontWeight:   700,
                    fontSize:     "1rem",
                    marginBottom: 3,
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize:   "0.78rem",
                    color:      "var(--text-muted)",
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>

            {/* Name field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="input"
                defaultValue={user.name}
              />
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                defaultValue={user.email}
              />
            </div>

            {/* Company */}
            <div className="flex flex-col gap-2">
              <label htmlFor="company">
                Company / Institution{" "}
                <span
                  style={{
                    color:         "var(--text-muted)",
                    fontWeight:    400,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (optional)
                </span>
              </label>
              <input
                id="company"
                type="text"
                className="input"
                defaultValue={user.company ?? ""}
                placeholder="e.g. Stripe, IIT Delhi"
              />
            </div>

            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", padding: "9px 20px" }}
            >
              Save Changes
            </button>
          </div>
        </Section>

        {/* Role & Goal */}
        <Section
          title="Role & Goal"
          description="How TraceAgent personalises your experience."
        >
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Your Role",
                value: ROLE_LABELS[user.role] ?? user.role,
              },
              {
                label: "Primary Goal",
                value: GOAL_LABELS[user.goal] ?? user.goal,
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "12px 16px",
                  borderRadius:   "var(--radius-md)",
                  background:     "var(--bg-elevated)",
                  border:         "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.72rem",
                    color:         "var(--text-muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize:   "0.875rem",
                    color:      "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              To change your role or goal, contact support or re-register.
            </p>
          </div>
        </Section>

        {/* Pipeline config */}
        <Section
          title="Pipeline Config"
          description="Information about your active infrastructure setup."
        >
          <div className="flex flex-col gap-3">
            {[
              { label: "Queue",    value: "Amazon SQS · us-east-1",      status: "ok"  },
              { label: "Model",    value: "llama-3.3-70b-versatile",       status: "ok"  },
              { label: "Database", value: "MongoDB Atlas · M0 Free Tier", status: "ok"  },
              { label: "Region",   value: "us-east-1 (N. Virginia)",      status: "ok"  },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "10px 14px",
                  borderRadius:   "var(--radius-md)",
                  background:     "var(--bg-elevated)",
                  border:         "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width:        6,
                      height:       6,
                      borderRadius: "50%",
                      background:   "var(--status-success)",
                      flexShrink:   0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "0.72rem",
                      color:         "var(--text-muted)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize:   "0.78rem",
                    color:      "var(--text-secondary)",
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Account info */}
        <Section
          title="Account"
          description="Your unique identifiers and session details."
        >
          <div className="flex flex-col gap-3">
            <div
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                padding:        "10px 14px",
                borderRadius:   "var(--radius-md)",
                background:     "var(--bg-elevated)",
                border:         "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.68rem",
                    color:         "var(--text-muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom:  3,
                  }}
                >
                  User ID
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize:   "0.78rem",
                    color:      "var(--text-secondary)",
                  }}
                >
                  {user.id}
                </p>
              </div>
              <button
                onClick={handleCopyId}
                className="btn btn-ghost"
                style={{ padding: "6px 12px", fontSize: "0.75rem", flexShrink: 0 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Copy
              </button>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section
          title="Danger Zone"
          description="Irreversible actions. Proceed with caution."
        >
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border:       "1px solid rgba(239,68,68,0.2)",
              overflow:     "hidden",
            }}
          >
            <div
              style={{
                padding:    "14px 18px",
                background: "rgba(239,68,68,0.05)",
                display:    "flex",
                alignItems: "center",
                gap:        12,
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily:   "var(--font-display)",
                    fontWeight:   600,
                    fontSize:     "0.875rem",
                    marginBottom: 3,
                    color:        "var(--text-primary)",
                  }}
                >
                  Sign out of all sessions
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Clears your local session and redirects to login.
                </p>
              </div>
              <button
                onClick={logout}
                className="btn btn-danger"
                style={{ flexShrink: 0, padding: "8px 16px", fontSize: "0.8rem" }}
              >
                Sign Out
              </button>
            </div>

            <div className="divider" style={{ margin: 0 }} />

            <div
              style={{
                padding:    "14px 18px",
                background: "rgba(239,68,68,0.05)",
                display:    "flex",
                alignItems: "center",
                gap:        12,
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily:   "var(--font-display)",
                    fontWeight:   600,
                    fontSize:     "0.875rem",
                    marginBottom: 3,
                    color:        "var(--text-primary)",
                  }}
                >
                  Delete account
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Permanently deletes your account and all incident data.
                </p>
              </div>
              {!danger ? (
                <button
                  onClick={() => setDanger(true)}
                  className="btn btn-danger"
                  style={{ flexShrink: 0, padding: "8px 16px", fontSize: "0.8rem" }}
                >
                  Delete Account
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => setDanger(false)}
                    className="btn btn-ghost"
                    style={{ padding: "8px 12px", fontSize: "0.78rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "8px 14px", fontSize: "0.78rem" }}
                  >
                    Confirm Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </div>
  );
}