"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!workspaceId) return;

    const params = new URLSearchParams();
    if (accountId) params.set("accountId", accountId);
    if (category) params.set("category", category);

    const query = params.toString();
    setLoading(true);
    setError(null);

    api
      .get<DashboardResponse>(`/dashboard${query ? `?${query}` : ""}`)
      .then((res) => setData(res))
      .catch((err) => setError(err.message ?? "Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, [accountId, category, workspaceId]);

  return { data, loading, error };
}
