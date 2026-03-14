"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { DashboardResponse } from "@/types/api";

interface UseDashboardOptions {
  accountId?: string;
  category?: string;
}

export function useDashboard({ accountId, category }: UseDashboardOptions = {}) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;

    const params = new URLSearchParams();
    if (accountId) params.set("accountId", accountId);
    if (category) params.set("category", category);

    const query = params.toString();
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<DashboardResponse>(`/dashboard${query ? `?${query}` : ""}`);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [accountId, category, workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, tick]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  return { data, loading, error, refetch };
}
