"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { BankAccountResponse } from "@/types/api";

export interface CreateWalletPayload {
  name: string;
  type: string;
  color: string;
  initialBalance: number;
}

export interface UpdateWalletPayload {
  name?: string;
  type?: string;
  color?: string;
}

export interface CreateTransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date: string;
}

export function useWallets() {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;

  const [wallets, setWallets] = useState<BankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const accounts = await api.get<BankAccountResponse[]>("/bank-accounts");
      setWallets(accounts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function createWallet(data: CreateWalletPayload) {
    await api.post("/bank-accounts", data);
    await fetchAll();
  }

  async function updateWallet(id: string, data: UpdateWalletPayload) {
    await api.patch(`/bank-accounts/${id}`, data);
    await fetchAll();
  }

  async function deleteWallet(id: string) {
    await api.delete(`/bank-accounts/${id}`);
    await fetchAll();
  }

  async function createTransfer(data: CreateTransferPayload) {
    await api.post("/transfers", data);
    await fetchAll();
  }

  return {
    wallets,
    loading,
    error,
    createWallet,
    updateWallet,
    deleteWallet,
    createTransfer,
    refetch: fetchAll,
  };
}
