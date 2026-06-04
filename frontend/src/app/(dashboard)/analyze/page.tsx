"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitIncident } from "@/hooks/useIncidents";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";
import Link from "next/link";

// Dynamically import Monaco — browser only
const TraceEditor = dynamic(
  () => import("@/components/incident/TraceEditor"),
  { ssr: false }
);

// ── Example traces ────────────────────────────────────────────────────────────

const EXAMPLE_TRACES: { label: string; service: string; trace: string }[] = [
  {
    label:   "NullPointerException",
    service: "payment-settlement-service",
    trace: `java.lang.NullPointerException: Cannot invoke "com.stripe.model.PaymentIntent.getStatus()" because "paymentIntent" is null
\tat com.example.payment.PaymentService.processPayment(PaymentService.java:142)
\tat com.example.payment.PaymentController.handleWebhook(PaymentController.java:89)
\tat sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
\tat sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
\tat org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)`,
  },
  {
    label:   "Redis ECONNREFUSED",
    service: "session-cache-service",
    trace: `Error: connect ECONNREFUSED 127.0.0.1:6379
\tat TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:16) {
  errno: -111,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '127.0.0.1',
  port: 6379
}
UnhandledPromiseRejectionWarning: RedisConnectionError: Failed to connect to Redis
\tat RedisClient.connect (/app/node_modules/redis/lib/client.js:223:13)`,
  },
  {
    label:   "Python KeyError",
    service: "data-processing-worker",
    trace: `Traceback (most recent call last):
  File "/app/workers/processor.py", line 87, in process_event
    user_id = event_data["user"]["id"]
KeyError: 'user'

During handling of the above exception, another exception occurred:

  File "/app/workers/processor.py", line 102, in handle_message
    result = self.process_event(message.body)
  File "/app/core/queue.py", line 45, in consume
    self.handler(msg)
RuntimeError: Event processing pipeline failed for message_id=msg_8f3a2c`,
  },
];

// ── Success State ─────────────────────────────────────────────────────────────

function SuccessState({
  logId,
  onReset,
}: {
  logId: string | null;
  onReset: () => void;
}) {
  return (
    <div
      className="card animate-fade-in"
      style={{
        padding:   "48px 32px",
        textAlign: "center",
        maxWidth:  480,
        margin:    "0 auto",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width:          56,
          height:         56,
          borderRadius:   "var(--radius-xl)",
          background:     "rgba(16,185,129,0.1)",
          border:         "1px solid rgba(16,185,129,0.25)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          margin:         "0 auto 20px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17l-5-5"
            stroke="var(--status-success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily:   "var(--font-display)",
          fontSize:     "1.3rem",
          fontWeight:   700,
          marginBottom: 8,
        }}
      >
        Trace queued successfully
      </h2>

      <p
        style={{
          fontSize:     "0.875rem",
          color:        "var(--text-secondary)",
          marginBottom: 8,
          lineHeight:   1.7,
        }}
      >
        Your stack trace has been pushed to the SQS pipeline. The background
        worker will process it via Amazon Bedrock shortly.
      </p>

      {logId && (
        <p
          style={{
            fontFamily:   "var(--font-mono)",
            fontSize:     "0.72rem",
            color:        "var(--text-muted)",
            marginBottom: 28,
            letterSpacing: "0.04em",
          }}
        >
          LOG_ID: {logId}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {logId && (
          <Link
            href={`/incident/${logId}`}
            className="btn btn-primary"
            style={{ justifyContent: "center" }}
          >
            View Incident
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <button
          onClick={onReset}
          className="btn btn-ghost"
          style={{ justifyContent: "center" }}
        >
          Analyze another trace
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const { user }                            = useAuth();
  const { submit, loading, error, success, logId, reset } = useSubmitIncident();

  const [serviceName, setServiceName] = useState("");
  const [rawLog, setRawLog]           = useState("");
  const [validationErr, setValidErr]  = useState<string | null>(null);

  const workspaceId = user
    ? `workspace-${user.id.slice(0, 8)}`
    : "workspace-prod-alpha";

  function loadExample(ex: typeof EXAMPLE_TRACES[number]) {
    setServiceName(ex.service);
    setRawLog(ex.trace);
    setValidErr(null);
    reset();
  }

  async function handleSubmit() {
    setValidErr(null);

    if (!serviceName.trim()) {
      setValidErr("Service name is required.");
      return;
    }
    if (rawLog.trim().length < 20) {
      setValidErr("Please paste a valid stack trace (min 20 characters).");
      return;
    }

    await submit({
      service_name: serviceName.trim(),
      raw_log:      rawLog.trim(),
      workspace_id: workspaceId,
    });
  }

  // ── Success view ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex flex-col gap-8">
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
            Analysis Pipeline
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize:   "1.75rem",
              fontWeight: 800,
            }}
          >
            Analyze Stack Trace
          </h1>
        </div>
        <SuccessState logId={logId} onReset={reset} />
      </div>
    );
  }

  // ── Form view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div
        style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            12,
        }}
      >
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
            Analysis Pipeline
          </p>
          <h1
            style={{
              fontFamily:   "var(--font-display)",
              fontSize:     "1.75rem",
              fontWeight:   800,
              marginBottom: 4,
            }}
          >
            Analyze Stack Trace
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Paste your raw error log and get instant AI-powered root cause
            analysis.
          </p>
        </div>

        {/* Workspace pill */}
        <div
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           7,
            padding:       "6px 12px",
            borderRadius:  "var(--radius-md)",
            background:    "var(--bg-elevated)",
            border:        "1px solid var(--border-subtle)",
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.72rem",
            color:         "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: "50%",
              background:   "var(--status-success)",
            }}
          />
          {workspaceId}
        </div>
      </div>

      {/* Error */}
      {(error || validationErr) && (
        <div
          className="animate-fade-in px-4 py-3 rounded-lg"
          style={{
            background: "rgba(239,68,68,0.08)",
            border:     "1px solid rgba(239,68,68,0.2)",
            fontSize:   "0.85rem",
            color:      "var(--status-error)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {error ?? validationErr}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── Left: main form ── */}
        <div className="flex flex-col gap-5">

          {/* Service name */}
          <div className="card" style={{ padding: "20px" }}>
            <div className="flex flex-col gap-2">
              <label htmlFor="service-name">Service Name</label>
              <input
                id="service-name"
                type="text"
                className="input"
                placeholder="e.g. payment-settlement-service"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}
              />
              <p
                style={{
                  fontSize:   "0.78rem",
                  color:      "var(--text-muted)",
                  marginTop:  2,
                }}
              >
                The microservice or application that threw this error.
              </p>
            </div>
          </div>

          {/* Trace editor */}
          <div className="card" style={{ padding: "20px" }}>
            <div className="flex flex-col gap-3">
              <div
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                }}
              >
                <label>Stack Trace</label>
                <span
                  style={{
                    fontFamily:    "var(--font-mono)",
                    fontSize:      "0.68rem",
                    color:         "var(--text-muted)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {rawLog.length.toLocaleString()} chars
                </span>
              </div>

              <TraceEditor
                value={rawLog}
                onChange={setRawLog}
                height={360}
              />

              <p
                style={{
                  fontSize: "0.78rem",
                  color:    "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Supports Java, Python, Node.js, Go, Ruby, and any plain-text
                stack trace format.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: "13px", fontSize: "0.95rem" }}
          >
            {loading ? <ButtonSpinner /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {loading ? "Queuing to SQS pipeline..." : "Run Analysis"}
          </button>
        </div>

        {/* ── Right: examples + info ── */}
        <div className="flex flex-col gap-4">

          {/* Example traces */}
          <div className="card" style={{ padding: "16px" }}>
            <p
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.68rem",
                color:         "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom:  12,
              }}
            >
              Load Example
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLE_TRACES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => loadExample(ex)}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: "flex-start",
                    padding:        "8px 12px",
                    fontSize:       "0.8rem",
                    gap:            8,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M14 2v6h6M9 13h6M9 17h4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline info */}
          <div className="card" style={{ padding: "16px" }}>
            <p
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.68rem",
                color:         "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom:  12,
              }}
            >
              How it works
            </p>
            <div className="flex flex-col gap-3">
              {[
                { step: "01", text: "Trace pushed to Amazon SQS queue" },
                { step: "02", text: "Background worker picks up message" },
                { step: "03", text: "Bedrock Nova analyses root cause" },
                { step: "04", text: "Result saved to MongoDB Atlas" },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "0.68rem",
                      color:         "var(--accent)",
                      letterSpacing: "0.04em",
                      flexShrink:    0,
                      marginTop:     2,
                    }}
                  >
                    {item.step}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color:    "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Token estimate */}
          <div
            style={{
              padding:      "12px 14px",
              borderRadius: "var(--radius-md)",
              background:   "var(--accent-glow)",
              border:       "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <p
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "0.68rem",
                color:         "var(--accent)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom:  5,
              }}
            >
              Cost Estimate
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              ~{Math.max(1, Math.ceil(rawLog.length / 4)).toLocaleString()} tokens
              &nbsp;·&nbsp;
              ~₹{((rawLog.length / 4) * 0.00006 * 84).toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}