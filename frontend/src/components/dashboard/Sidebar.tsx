"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/utils";

// ── Nav Items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href:  "/dashboard",
    label: "Overview",
    exact: true,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href:  "/analyze",
    label: "Analyze",
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M11 19H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="18" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M21 22l-1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href:  "/history",
    label: "History",
    exact: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3.05 11a9 9 0 1 0 .5-3M3 5v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    href:  "/settings",
    label: "Settings",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

// ── Nav Link ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon,
  exact,
  onClick,
}: {
  href:     string;
  label:    string;
  icon:     React.ReactNode;
  exact?:   boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active   = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            10,
        padding:        "9px 12px",
        borderRadius:   "var(--radius-md)",
        fontSize:       "0.875rem",
        fontFamily:     "var(--font-display)",
        fontWeight:     active ? 600 : 400,
        color:          active ? "var(--text-primary)" : "var(--text-muted)",
        background:     active ? "var(--bg-elevated)"  : "transparent",
        borderLeft:     active ? "2px solid var(--accent)" : "2px solid transparent",
        textDecoration: "none",
        transition:     "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color      = "var(--text-secondary)";
          (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color      = "var(--text-muted)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {icon}
      {label}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside
      style={{
        width:           "var(--sidebar-width)",
        minHeight:       "100vh",
        background:      "var(--bg-surface)",
        borderRight:     "1px solid var(--border-subtle)",
        display:         "flex",
        flexDirection:   "column",
        padding:         "24px 16px",
        position:        "sticky",
        top:             0,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32, paddingLeft: 4 }}>
        <Logo size="sm" href="/dashboard" />
      </div>

      {/* Section label */}
      <p
        style={{
          fontFamily:    "var(--font-mono)",
          fontSize:      "0.65rem",
          color:         "var(--text-muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom:  8,
          paddingLeft:   12,
        }}
      >
        Workspace
      </p>

      {/* Main nav */}
      <nav className="flex flex-col gap-1" style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        <div className="divider" style={{ margin: "16px 0" }} />

        <p
          style={{
            fontFamily:    "var(--font-mono)",
            fontSize:      "0.65rem",
            color:         "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom:  8,
            paddingLeft:   12,
          }}
        >
          System
        </p>

        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* User profile block */}
      {user && (
        <div
          style={{
            marginTop:    "auto",
            paddingTop:   16,
            borderTop:    "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              display:       "flex",
              alignItems:    "center",
              gap:           10,
              padding:       "10px 12px",
              borderRadius:  "var(--radius-md)",
              background:    "var(--bg-elevated)",
              border:        "1px solid var(--border-subtle)",
              marginBottom:  10,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width:          32,
                height:         32,
                borderRadius:   "50%",
                background:     "var(--accent-glow)",
                border:         "1px solid rgba(245,158,11,0.3)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                fontFamily:     "var(--font-display)",
                fontWeight:     700,
                fontSize:       "0.75rem",
                color:          "var(--accent)",
              }}
            >
              {initials(user.name)}
            </div>

            {/* Name + email */}
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p
                style={{
                  fontFamily:   "var(--font-display)",
                  fontWeight:   600,
                  fontSize:     "0.8rem",
                  color:        "var(--text-primary)",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                }}
              >
                {user.name}
              </p>
              <p
                style={{
                  fontSize:     "0.72rem",
                  color:        "var(--text-muted)",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                  fontFamily:   "var(--font-mono)",
                }}
              >
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="btn btn-ghost"
            style={{
              width:      "100%",
              padding:    "8px",
              fontSize:   "0.8rem",
              gap:        8,
              color:      "var(--text-muted)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}