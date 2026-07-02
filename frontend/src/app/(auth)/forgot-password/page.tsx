"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/Logo";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

type Step = "email" | "otp" | "success";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Background ────────────────────────────────────────────────────────────────

function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div
        className="absolute"
        style={{
          bottom: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "60vw", height: "50vh",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ── OTP Input ─────────────────────────────────────────────────────────────────

function OTPInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {digits.map((d, i) => (
        <div
          key={i}
          style={{
            width:          44,
            height:         52,
            borderRadius:   "var(--radius-md)",
            background:     "var(--bg-elevated)",
            border:         `1px solid ${value.length === i ? "var(--accent-dim)" : "var(--border-default)"}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontFamily:     "var(--font-mono)",
            fontSize:       "1.3rem",
            fontWeight:     700,
            color:          d.trim() ? "var(--text-primary)" : "transparent",
            boxShadow:      value.length === i ? "0 0 0 3px var(--accent-glow)" : "none",
            transition:     "all 0.15s ease",
          }}
        >
          {d.trim() || ""}
        </div>
      ))}
      {/* Hidden real input */}
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        style={{
          position: "absolute",
          opacity:  0,
          width:    1,
          height:   1,
        }}
        autoFocus
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const router                    = useRouter();
  const [step, setStep]           = useState<Step>("email");
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to send code.");
      setStep("otp");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP + reset password ────────────────────────────────────

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length < 6) { setError("Enter the full 6-digit code."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Invalid or expired code.");
      setStep("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
        <div className="flex justify-center mb-10">
          <Logo size="lg" href="/" />
        </div>

        <div
          className="card"
          style={{ padding: "36px 32px", borderColor: "var(--border-default)" }}
        >

          {/* ── Step: Email ── */}
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}>
                  Reset your password
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Enter your email and we'll send a 6-digit reset code.
                </p>
              </div>

              {error && (
                <div className="animate-fade-in px-4 py-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.85rem", color: "var(--status-error)", fontFamily: "var(--font-mono)" }}>
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: "12px" }}
              >
                {loading ? <ButtonSpinner /> : null}
                {loading ? "Sending code..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* ── Step: OTP + new password ── */}
          {step === "otp" && (
            <form onSubmit={handleReset} className="flex flex-col gap-6">
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}>
                  Enter reset code
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  We sent a 6-digit code to{" "}
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                    {email}
                  </span>
                </p>
              </div>

              {error && (
                <div className="animate-fade-in px-4 py-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.85rem", color: "var(--status-error)", fontFamily: "var(--font-mono)" }}>
                  {error}
                </div>
              )}

              {/* OTP boxes */}
              <div
                className="flex flex-col gap-2"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>("input[type=text]");
                  input?.focus();
                }}
                style={{ cursor: "text" }}
              >
                <label>6-Digit Code</label>
                <OTPInput value={otp} onChange={setOtp} />
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
                  Code expires in 15 minutes
                </p>
              </div>

              {/* New password */}
              <div className="flex flex-col gap-2">
                <label htmlFor="new-password">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type={showPass ? "text" : "password"}
                    className="input"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}
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
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(null); }} className="btn btn-ghost" style={{ flex: 1 }}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || otp.length < 6} style={{ flex: 2, padding: "12px" }}>
                  {loading ? <ButtonSpinner /> : null}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>

              {/* Resend */}
              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(""); setError(null); }}
                  style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                >
                  Resend code
                </button>
              </p>
            </form>
          )}

          {/* ── Step: Success ── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-5 text-center animate-fade-in">
              <div style={{ width: 56, height: 56, borderRadius: "var(--radius-xl)", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--status-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, marginBottom: 6 }}>
                  Password reset!
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Your password has been updated. You can now sign in.
                </p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px" }}
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Remember it?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 12, fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          TRACE_AGENT · INCIDENT ANALYSIS PIPELINE
        </p>
      </div>
    </div>
  );
}