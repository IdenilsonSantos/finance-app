"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { ScheduledTransactionResponse, PaginatedResponse } from "@/types/api";

export interface CreateScheduledTransactionPayload {
  bankAccountId: string;
  amount: number;
  type: "income" | "expense";
  description?: string;
  category: string;
  frequency: "once" | "daily" | "weekly" | "monthly" | "yearly";
  nextDate: string;
  endDate?: string;
}

export interface UpdateScheduledTransactionPayload {
  bankAccountId?: string;
  amount?: number;
  type?: "income" | "expense";
  description?: string;
  category?: string;
  frequency?: "once" | "daily" | "weekly" | "monthly" | "yearly";
  nextDate?: string;
  endDate?: string;
}

export interface ScheduledTransactionFilters {
  page?: number;
  limit?: number;
  frequency?: "once" | "daily" | "weekly" | "monthly" | "yearly";
  accountId?: string;
}

export function useScheduledTransactions(filters: ScheduledTransactionFilters = {}) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 50));
  if (filters.frequency) params.set("frequency", filters.frequency);
  if (filters.accountId) params.set("accountId", filters.accountId);

  const { data, isLoading, error } = useQuery<PaginatedResponse<ScheduledTransactionResponse>>({
    queryKey: ["scheduled-transactions", workspaceId, params.toString()],
    queryFn: () =>
      api.get<PaginatedResponse<ScheduledTransactionResponse>>(
        `/scheduled-transactions?${params}`,
      ),
    enabled: !!workspaceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["scheduled-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function createScheduledTransaction(payload: CreateScheduledTransactionPayload) {
    await api.post("/scheduled-transactions", payload);
    invalidate();
  }

  async function updateScheduledTransaction(id: string, payload: UpdateScheduledTransactionPayload) {
    await api.patch(`/scheduled-transactions/${id}`, payload);
    invalidate();
  }

  async function deleteScheduledTransaction(id: string) {
    await api.delete(`/scheduled-transactions/${id}`);
    invalidate();
  }

  async function executeScheduledTransaction(id: string) {
    await api.post(`/scheduled-transactions/${id}/execute`);
    invalidate();
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
  }

  return {
    scheduled: data?.data ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 1,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar agendamentos") : null,
    createScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    executeScheduledTransaction,
  };
}
