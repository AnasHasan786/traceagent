"use client";

import { useEffect, useState } from "react";

interface Props {
  value:    string;
  onChange: (val: string) => void;
  height?:  number;
}

// ── Thin wrapper around Monaco ────────────────────────────────────────────────
// We lazy-load it so Next.js doesn't try to SSR it (Monaco is browser-only).

export default function TraceEditor({ value, onChange, height = 320 }: Props) {
  return <MonacoInner value={value} onChange={onChange} height={height} />;
}

// ── Actual Monaco component (only rendered client-side) ───────────────────────

function MonacoInner({
  value,
  onChange,
  height,
}: {
  value:    string;
  onChange: (val: string) => void;
  height:   number;
}) {
  const [Editor, setEditor] = useState<React.ComponentType<{
    height:          number;
    defaultLanguage: string;
    value:           string;
    onChange:        (val: string | undefined) => void;
    theme:           string;
    options:         object;
    onMount:         (editor: unknown, monaco: unknown) => void;
  }> | null>(null);

  useEffect(() => {
    import("@monaco-editor/react").then((mod) => {
      setEditor(() => mod.default);
    });
  }, []);

  if (!Editor) {
    return (
      <div
        className="skeleton"
        style={{ height, borderRadius: "var(--radius-lg)" }}
      />
    );
  }

  return (
    <div className="monaco-wrapper">
      <Editor
        height={height}
        defaultLanguage="plaintext"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        theme="vs-dark"
        options={{
          fontSize:             13,
          fontFamily:           "'JetBrains Mono', monospace",
          fontLigatures:        true,
          lineNumbers:          "on",
          minimap:              { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap:             "on",
          padding:              { top: 16, bottom: 16 },
          renderLineHighlight:  "none",
          overviewRulerLanes:   0,
          scrollbar: {
            vertical:            "auto",
            horizontal:          "hidden",
            verticalScrollbarSize: 5,
          },
        }}
        onMount={(editor, monaco) => {
          // Override Monaco's default dark background with our design tokens
          (monaco as {
            editor: {
              defineTheme: (name: string, config: object) => void;
              setTheme:    (name: string) => void;
            };
          }).editor.defineTheme("trace-agent", {
            base:    "vs-dark",
            inherit: true,
            rules:   [],
            colors: {
              "editor.background":          "#13151a",
              "editor.lineHighlightBackground": "#1a1d24",
              "editorLineNumber.foreground": "#4e5568",
              "editorLineNumber.activeForeground": "#8b92a8",
              "editor.selectionBackground": "rgba(245,158,11,0.2)",
              "editorCursor.foreground":    "#f59e0b",
              "scrollbarSlider.background": "#2a2f3d",
            },
          });
          (monaco as {
            editor: { setTheme: (name: string) => void };
          }).editor.setTheme("trace-agent");
        }}
      />
    </div>
  );
}