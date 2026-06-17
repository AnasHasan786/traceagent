"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import {
  getStoredUser,
  setStoredUser,
  setToken,
  getToken,
  clearSession,
  isAuthenticated,
} from "@/lib/auth";
import { User, OnboardingState } from "@/types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setLoading(false);
    } else {
      authApi
        .me()
        .then((u) => { setStoredUser(u); setUser(u); })
        .catch(() => clearSession())
        .finally(() => setLoading(false));
    }
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { token, user: nextUser } = await authApi.login(email, password);
        setToken(token);
        setStoredUser(nextUser);
        setUser(nextUser);
        router.push("/dashboard");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Login failed.";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // ── Register ─────────────────────────────────────────────────────────────────

  const register = useCallback(
    async (state: OnboardingState) => {
      setLoading(true);
      setError(null);
      try {
        const { token, user: nextUser } = await authApi.register({
          name: state.name,
          email: state.email,
          password: state.password,
          role: state.role,
          goal: state.goal,
          company: state.company || undefined,
        });
        setToken(token);
        setStoredUser(nextUser);
        setUser(nextUser);
        router.push("/dashboard");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Registration failed.";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // ── Logout ───────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  // ── Update user (settings page) ──────────────────────────────────────────────

  const updateUser = useCallback((updated: User) => {
    setStoredUser(updated);
    setUser(updated);
  }, []);

  return {
    user,
    loading,
    error,
    token: getToken(),
    login,
    register,
    logout,
    setUser: updateUser,
  };
}