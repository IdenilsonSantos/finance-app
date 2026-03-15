"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { TransactionResponse, BankAccountResponse } from "@/types/api";

export interface CreateTransactionPayload {
  bankAccountId: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  beneficiary?: string;
  paymentMethod?: string;
  date: string;
}

export interface UpdateTransactionPayload {
  bankAccountId?: string;
  amount?: number;
  type?: "income" | "expense";
  category?: string;
  description?: string | null;
  beneficiary?: string | null;
  paymentMethod?: string | null;
  date?: string;
}

export function useTransactions() {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const txQuery = useQuery<TransactionResponse[]>({
    queryKey: ["transactions", workspaceId],
    queryFn: () => api.get<TransactionResponse[]>("/transactions"),
    enabled: !!workspaceId,
  });

  const accountsQuery = useQuery<BankAccountResponse[]>({
    queryKey: ["bank-accounts", workspaceId],
    queryFn: () => api.get<BankAccountResponse[]>("/bank-accounts"),
    enabled: !!workspaceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function createTransaction(data: CreateTransactionPayload) {
    await api.post("/transactions", data);
    invalidate();
  }

  async function updateTransaction(id: string, data: UpdateTransactionPayload) {
    await api.patch(`/transactions/${id}`, data);
    invalidate();
  }

  async function deleteTransaction(id: string) {
    await api.delete(`/transactions/${id}`);
    invalidate();
  }

  return {
    transactions: txQuery.data ?? [],
    bankAccounts: accountsQuery.data ?? [],
    loading: txQuery.isLoading || accountsQuery.isLoading,
    error: txQuery.error
      ? (txQuery.error instanceof Error ? txQuery.error.message : "Erro ao carregar dados")
      : null,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: () => invalidate(),
  };
}
