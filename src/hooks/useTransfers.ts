"use client";

import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { PaginatedResponse, TransferResponse } from "@/types/api";

export interface UpdateTransferPayload {
  fromAccountId?: string;
  toAccountId?: string;
  /** Reais (como na criação). */
  amount?: number;
  description?: string | null;
  date?: string;
}

export interface TransferFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useTransfers(filters: TransferFilters = {}) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.accountId) params.set("accountId", filters.accountId);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  const { data, isLoading, error } = useQuery<PaginatedResponse<TransferResponse>>({
    queryKey: ["transfers", workspaceId, params.toString()],
    queryFn: () => api.get<PaginatedResponse<TransferResponse>>(`/transfers?${params}`),
    enabled: !!workspaceId && (filters.enabled ?? true),
    placeholderData: keepPreviousData,
  });

  async function updateTransfer(id: string, payload: UpdateTransferPayload) {
    await api.patch(`/transfers/${id}`, payload);
    queryClient.invalidateQueries({ queryKey: ["transfers"] });
    queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function deleteTransfer(id: string) {
    await api.delete(`/transfers/${id}`);
    queryClient.invalidateQueries({ queryKey: ["transfers"] });
    queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return {
    transfers: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar transferências") : null,
    updateTransfer,
    deleteTransfer,
  };
}
