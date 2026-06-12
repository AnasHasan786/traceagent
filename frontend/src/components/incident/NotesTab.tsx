"use client";

import { useState } from "react";
import { incidentApi } from "@/lib/api";
import { Note } from "@/types";
import { formatDate, formatRelative } from "@/lib/utils";

interface Props {
  incidentId: string;
  initialNotes: Note[];
}

export default function NotesTab({ incidentId, initialNotes }: Props) {
  const [notes, setNotes]       = useState<Note[]>(
    [...initialNotes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  );
  const [body, setBody]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const charLimit = 2000;

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const note = await incidentApi.addNote(incidentId, trimmed);
      setNotes((prev) => [note, ...prev]);
      setBody("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId);
    try {
      await incidentApi.deleteNote(incidentId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete note.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter or Cmd+Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Composer ── */}
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          border:       "1px solid var(--border-default)",
          overflow:     "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding:      "12px 18px",
            background:   "var(--bg-elevated)",
            borderBottom: "1px solid var(--border-subtle)",
            display:      "flex",
            alignItems:   "center",
            gap:          8,
          }}
        >
          <div
            style={{
              width:          28,
              height:         28,
              borderRadius:   "var(--radius-md)",
              background:     "rgba(245,166,35,0.1)",
              border:         "1px solid rgba(245,166,35,0.2)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </div>
          <p
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "0.72rem",
              color:         "var(--accent)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight:    500,
            }}
          >
            Add Investigation Note
          </p>
        </div>

        {/* Textarea */}
        <div style={{ padding: "14px 18px 12px", background: "var(--bg-surface)" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              "Document your debugging steps, findings, or resolution...\n" +
              "e.g. Fixed by rolling back deployment #42 at 3:15 PM"
            }
            maxLength={charLimit}
            rows={4}
            style={{
              width:        "100%",
              background:   "var(--bg-elevated)",
              border:       "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              padding:      "12px 14px",
              fontFamily:   "var(--font-mono)",
              fontSize:     "0.82rem",
              color:        "var(--text-primary)",
              lineHeight:   1.7,
              resize:       "vertical",
              outline:      "none",
              boxSizing:    "border-box",
              transition:   "border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
          />

          {/* Footer row: char count + submit */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginTop:      8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "0.68rem",
                color:      body.length > charLimit * 0.9
                  ? "var(--status-error)"
                  : "var(--text-muted)",
              }}
            >
              {body.length} / {charLimit}
              <span style={{ marginLeft: 10, opacity: 0.6 }}>
                Ctrl+Enter to save
              </span>
            </span>

            <button
              onClick={handleSubmit}
              disabled={submitting || !body.trim()}
              className="btn btn-primary"
              style={{ padding: "7px 16px", fontSize: "0.8rem" }}
            >
              {submitting ? (
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  style={{ animation: "spin 0.7s linear infinite" }}
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor"
                    strokeWidth="1.5" strokeDasharray="40" strokeDashoffset="10"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <line x1="22" y1="2" x2="11" y2="13"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"
                    stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {submitting ? "Saving…" : "Save Note"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "0.75rem",
                color:      "var(--status-error)",
                marginTop:  8,
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {/* ── Notes list ── */}
      {notes.length === 0 ? (
        <div
          style={{
            padding:      "40px 20px",
            textAlign:    "center",
            borderRadius: "var(--radius-lg)",
            border:       "1px dashed var(--border-subtle)",
          }}
        >
          <div
            style={{
              width:          44,
              height:         44,
              borderRadius:   "var(--radius-lg)",
              background:     "var(--bg-elevated)",
              border:         "1px solid var(--border-subtle)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              margin:         "0 auto 12px",
              color:          "var(--text-muted)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                stroke="currentColor" strokeWidth="1.5"
              />
              <path
                d="M14 2v6h6M9 13h6M9 17h4"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              />
            </svg>
          </div>
          <p
            style={{
              fontFamily:   "var(--font-display)",
              fontWeight:   600,
              fontSize:     "0.875rem",
              marginBottom: 4,
            }}
          >
            No notes yet
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Document your debugging steps and findings above
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note, i) => (
            <div
              key={note.id}
              style={{
                borderRadius: "var(--radius-lg)",
                border:       "1px solid var(--border-default)",
                overflow:     "hidden",
              }}
            >
              {/* Note header */}
              <div
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  padding:        "9px 14px",
                  background:     "var(--bg-elevated)",
                  borderBottom:   "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Index badge */}
                  <span
                    style={{
                      fontFamily:    "var(--font-mono)",
                      fontSize:      "0.65rem",
                      color:         "var(--text-muted)",
                      background:    "var(--bg-overlay)",
                      border:        "1px solid var(--border-subtle)",
                      borderRadius:  99,
                      padding:       "1px 8px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    #{notes.length - i}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize:   "0.7rem",
                      color:      "var(--text-muted)",
                    }}
                    title={formatDate(note.created_at)}
                  >
                    {formatRelative(note.created_at)}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  style={{
                    background:   "transparent",
                    border:       "none",
                    cursor:       "pointer",
                    padding:      4,
                    borderRadius: "var(--radius-sm)",
                    color:        "var(--text-muted)",
                    display:      "flex",
                    alignItems:   "center",
                    opacity:      deletingId === note.id ? 0.4 : 1,
                    transition:   "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--status-error)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                  title="Delete note"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <polyline points="3 6 5 6 21 6"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path
                      d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                    />
                    <path d="M10 11v6M14 11v6"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Note body */}
              <div
                style={{
                  padding:    "14px 16px",
                  background: "var(--bg-surface)",
                }}
              >
                <p
                  style={{
                    fontSize:   "0.875rem",
                    color:      "var(--text-primary)",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                    wordBreak:  "break-word",
                  }}
                >
                  {note.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}