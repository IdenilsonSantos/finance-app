"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { BudgetSummaryItem } from "@/types/api";

export interface CreateBudgetPayload {
  category: string;
  /** Valor em centavos. */
  amount: number;
  month: string;
}

/** `month` no formato YYYY-MM. */
export function useBudgets(month: string) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BudgetSummaryItem[]>({
    queryKey: ["budgets", workspaceId, month],
    queryFn: () => api.get<BudgetSummaryItem[]>(`/budgets/summary?month=${month}`),
    enabled: !!workspaceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function createBudget(payload: CreateBudgetPayload) {
    await api.post("/budgets", { ...payload, amount: payload.amount / 100 });
    invalidate();
  }

  async function updateBudget(id: string, amountInCents: number) {
    await api.patch(`/budgets/${id}`, { amount: amountInCents / 100 });
    invalidate();
  }

  async function deleteBudget(id: string) {
    await api.delete(`/budgets/${id}`);
    invalidate();
  }

  async function copyBudgets(fromMonth: string, toMonth: string) {
    const result = await api.post<{ created: number; skipped: number }>("/budgets/copy", {
      fromMonth,
      toMonth,
    });
    invalidate();
    return result;
  }

  return {
    budgets: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar orçamentos") : null,
    createBudget,
    updateBudget,
    deleteBudget,
    copyBudgets,
  };
}
