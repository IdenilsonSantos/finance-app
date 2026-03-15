"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BankAccountResponse[]>({
    queryKey: ["bank-accounts", workspaceId],
    queryFn: () => api.get<BankAccountResponse[]>("/bank-accounts"),
    enabled: !!workspaceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  }

  async function createWallet(payload: CreateWalletPayload) {
    await api.post("/bank-accounts", payload);
    invalidate();
  }

  async function updateWallet(id: string, payload: UpdateWalletPayload) {
    await api.patch(`/bank-accounts/${id}`, payload);
    invalidate();
  }

  async function deleteWallet(id: string) {
    await api.delete(`/bank-accounts/${id}`);
    invalidate();
  }

  async function createTransfer(payload: CreateTransferPayload) {
    await api.post("/transfers", payload);
    invalidate();
  }

  return {
    wallets: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar contas") : null,
    createWallet,
    updateWallet,
    deleteWallet,
    createTransfer,
    refetch: () => invalidate(),
  };
}
