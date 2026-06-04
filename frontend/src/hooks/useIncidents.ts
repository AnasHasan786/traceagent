"use client";

import { useState, useEffect, useCallback } from "react";
import { incidentApi, dashboardApi } from "@/lib/api";
import { Incident, DashboardStats, IncidentSubmitPayload } from "@/types";

// ── Incident List ─────────────────────────────────────────────────────────────

export function useIncidents(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await incidentApi.list(params);
      setIncidents(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetch(); }, [fetch]);

  return { incidents, total, loading, error, refetch: fetch };
}

// ── Single Incident ───────────────────────────────────────────────────────────

export function useIncident(id: string) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    incidentApi
      .get(id)
      .then(setIncident)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load incident.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { incident, loading, error };
}

// ── Submit Incident ───────────────────────────────────────────────────────────

export function useSubmitIncident() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [logId, setLogId]       = useState<string | null>(null);

  const submit = useCallback(async (payload: IncidentSubmitPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await incidentApi.submit(payload);
      setLogId(res.log_id);
      setSuccess(true);
      return res;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submission failed.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLogId(null);
  }, []);

  return { submit, loading, error, success, logId, reset };
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export function useDashboardStats() {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .stats()
      .then(setStats)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load stats.");
      })
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}