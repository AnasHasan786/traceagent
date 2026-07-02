"use client";

import { useState } from "react";
import { OnboardingState } from "@/types";
interface Props {
  state:   OnboardingState;
  update:  (fields: Partial<OnboardingState>) => void;
  onNext:  () => void;
}

export default function StepCredentials({ state, update, onNext }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!state.name.trim())              e.name = "Name is required.";
    if (!state.email.includes("@"))      e.email = "Enter a valid email.";
    if (state.password.length < 8)       e.password = "Minimum 8 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) onNext();
  }

  return (
    <form onSubmit={handleNext} className="flex flex-col gap-5">
      <div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Create your account
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Takes 30 seconds. No credit card required.
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          className={`input ${errors.name ? "input-error" : ""}`}
          placeholder="Enter your full name"
          value={state.name}
          onChange={(e) => update({ name: e.target.value })}
          autoFocus
        />
        {errors.name && (
          <span style={{ fontSize: "0.78rem", color: "var(--status-error)", fontFamily: "var(--font-mono)" }}>
            {errors.name}
          </span>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className={`input ${errors.email ? "input-error" : ""}`}
          placeholder="you@company.com"
          value={state.email}
          onChange={(e) => update({ email: e.target.value })}
        />
        {errors.email && (
          <span style={{ fontSize: "0.78rem", color: "var(--status-error)", fontFamily: "var(--font-mono)" }}>
            {errors.email}
          </span>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label htmlFor="password">Password</label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            type={showPass ? "text" : "password"}
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="Min. 8 characters"
            value={state.password}
            onChange={(e) => update({ password: e.target.value })}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPass ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <span style={{ fontSize: "0.78rem", color: "var(--status-error)", fontFamily: "var(--font-mono)" }}>
            {errors.password}
          </span>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ marginTop: 4, padding: "12px" }}
      >
        Continue
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </form>
  );
}