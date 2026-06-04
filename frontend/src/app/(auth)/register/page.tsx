"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingState } from "@/types";
import Logo from "@/components/shared/Logo";
import StepCredentials from "./steps/StepCredentials";
import StepRole from "./steps/StepRole";
import StepGoal from "./steps/StepGoal";
import StepComplete from "./steps/StepComplete";

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full flex items-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            background:
              i < step
                ? "var(--accent)"
                : i === step
                ? "var(--border-strong)"
                : "var(--border-subtle)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ── Step Label ────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Account", "Your Role", "Your Goal", "All Set"];

function StepLabel({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--accent)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Step {step + 1} of {total} — {STEP_LABELS[step]}
      </p>
    </div>
  );
}

// ── Background ────────────────────────────────────────────────────────────────

function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(255,255,255,0.025)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div
        className="absolute"
        style={{
          top: "-10%",
          right: "-10%",
          width: "55vw",
          height: "55vh",
          background:
            "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const INITIAL_STATE: OnboardingState = {
  step:     0,
  name:     "",
  email:    "",
  password: "",
  role:     "",
  goal:     "",
  company:  "",
};

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [state, setState]     = useState<OnboardingState>(INITIAL_STATE);
  const [error, setError]     = useState<string | null>(null);

  function update(fields: Partial<OnboardingState>) {
    setState((prev) => ({ ...prev, ...fields }));
  }

  function next() {
    setError(null);
    setState((prev) => ({ ...prev, step: prev.step + 1 }));
  }

  function back() {
    setError(null);
    setState((prev) => ({ ...prev, step: prev.step - 1 }));
  }

  async function handleSubmit() {
    setError(null);
    try {
      await register(state);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed.");
      setState((prev) => ({ ...prev, step: 0 }));
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ position: "relative" }}
    >
      <Background />

      <div
        className="w-full animate-fade-in"
        style={{ maxWidth: 480, position: "relative", zIndex: 1 }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" href="/" />
        </div>

        {/* Card */}
        <div
          className="card"
          style={{ padding: "36px 32px", borderColor: "var(--border-default)" }}
        >
          <StepLabel step={state.step} total={TOTAL_STEPS} />
          <ProgressBar step={state.step} total={TOTAL_STEPS} />

          {/* Error banner */}
          {error && (
            <div
              className="animate-fade-in mb-6 px-4 py-3 rounded-lg"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "0.85rem",
                color: "var(--status-error)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {error}
            </div>
          )}

          {/* Steps */}
          {state.step === 0 && (
            <StepCredentials state={state} update={update} onNext={next} />
          )}
          {state.step === 1 && (
            <StepRole state={state} update={update} onNext={next} onBack={back} />
          )}
          {state.step === 2 && (
            <StepGoal
              state={state}
              update={update}
              onNext={next}
              onBack={back}
            />
          )}
          {state.step === 3 && (
            <StepComplete
              state={state}
              loading={loading}
              onSubmit={handleSubmit}
              onBack={back}
            />
          )}
        </div>

        {/* Sign in link */}
        {state.step === 0 && (
          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}