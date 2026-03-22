"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { ScheduledTransactionResponse } from "@/types/api";

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

export function useScheduledTransactions() {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ScheduledTransactionResponse[]>({
    queryKey: ["scheduled-transactions", workspaceId],
    queryFn: () => api.get<ScheduledTransactionResponse[]>("/scheduled-transactions"),
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
    scheduled: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar agendamentos") : null,
    createScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
    executeScheduledTransaction,
  };
}
