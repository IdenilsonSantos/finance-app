"use client";

import { useState, useEffect, useCallback } from "react";
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

  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const [txs, accounts] = await Promise.all([
        api.get<TransactionResponse[]>("/transactions"),
        api.get<BankAccountResponse[]>("/bank-accounts"),
      ]);
      setTransactions(txs);
      setBankAccounts(accounts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function createTransaction(data: CreateTransactionPayload) {
    await api.post("/transactions", data);
    await fetchAll();
  }

  async function updateTransaction(id: string, data: UpdateTransactionPayload) {
    await api.patch(`/transactions/${id}`, data);
    await fetchAll();
  }

  async function deleteTransaction(id: string) {
    await api.delete(`/transactions/${id}`);
    await fetchAll();
  }

  return {
    transactions,
    bankAccounts,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchAll,
  };
}
