"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router          = useRouter();
  const pathname        = usePathname();
  const { loading }     = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  if (loading) {
    return <PageLoader message="Initialising workspace..." />;
  }

  return (
    <div className="dashboard-layout">

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`sidebar-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <main className="dashboard-main animate-fade-in">

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Logo text on mobile */}
          <span style={{
            fontFamily:    "var(--font-display)",
            fontWeight:    800,
            fontSize:      "1rem",
            color:         "var(--accent)",
            letterSpacing: "-0.02em",
          }}>
            TraceAgent
          </span>
          <div style={{ width: 36 }} /> {/* spacer to center logo */}
        </div>

        {children}
      </main>
    </div>
  );
}