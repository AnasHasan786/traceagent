"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/shared/Logo";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

// ── Background ────────────────────────────────────────────────────────────────

function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Left glow */}
      <div
        className="absolute"
        style={{
          top: "20%",
          left: "-10%",
          width: "50vw",
          height: "60vh",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, loading } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ position: "relative" }}
    >
      <Background />

      <div
        className="animate-fade-in w-full"
        style={{ maxWidth: 420, position: "relative", zIndex: 1 }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" href="/" />
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: "36px 32px",
            borderColor: "var(--border-default)",
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Sign in to your TraceAgent workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-fade-in mb-5 px-4 py-3 rounded-lg"
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`input ${error ? "input-error" : ""}`}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password">Password</label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.7rem",
                    color:         "var(--accent)",
                    textDecoration: "none",
                    letterSpacing: "0.04em",
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className={`input ${error ? "input-error" : ""}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                {/* Show/hide toggle */}
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
                    padding: 0,
                  }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: 4, padding: "12px", fontSize: "0.9rem" }}
            >
              {loading ? <ButtonSpinner /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="divider" style={{ margin: "24px 0" }} />

          {/* Footer */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            No account yet?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--accent)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Bottom mono label */}
        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontFamily: "var(--font-mono)",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
          }}
        >
          TRACE_AGENT · INCIDENT ANALYSIS PIPELINE
        </p>
      </div>
    </div>
  );
}