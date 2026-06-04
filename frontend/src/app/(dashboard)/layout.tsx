"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router        = useRouter();
  const { loading }   = useAuth();

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
      <Sidebar />
      <main className="dashboard-main animate-fade-in">
        {children}
      </main>
    </div>
  );
}