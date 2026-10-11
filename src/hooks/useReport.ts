"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { ReportResponse } from "@/types/api";

export function useReport(startDate: string, endDate: string, accountId?: string) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const params = new URLSearchParams({ startDate, endDate });
  if (accountId) params.set("accountId", accountId);

  const { data, isLoading, isFetching, error } = useQuery<ReportResponse>({
    queryKey: ["reports", workspaceId, params.toString()],
    queryFn: () => api.get<ReportResponse>(`/reports?${params}`),
    enabled: !!workspaceId && !!startDate && !!endDate && startDate <= endDate,
    placeholderData: keepPreviousData,
  });

  return {
    report: data ?? null,
    loading: isLoading,
    refreshing: isFetching && !isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar relatório") : null,
  };
}
