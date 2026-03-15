"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { DashboardResponse } from "@/types/api";

interface UseDashboardOptions {
  accountId?: string;
}

export function useDashboard({ accountId }: UseDashboardOptions = {}) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;

  const query = accountId ? `?accountId=${accountId}` : "";

  const { data, isLoading, error, refetch } = useQuery<DashboardResponse>({
    queryKey: ["dashboard", workspaceId, accountId],
    queryFn: () => api.get<DashboardResponse>(`/dashboard${query}`),
    enabled: !!workspaceId,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar dados") : null,
    refetch,
  };
}
