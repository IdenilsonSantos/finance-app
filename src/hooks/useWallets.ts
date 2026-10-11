"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { BankAccountResponse } from "@/types/api";

export interface CreditCardFields {
  /** Limite em centavos. */
  creditLimit?: number | null;
  closingDay?: number;
  dueDay?: number;
}

export interface CreateWalletPayload extends CreditCardFields {
  name: string;
  type: string;
  color: string;
  initialBalance: number;
}

export interface UpdateWalletPayload extends CreditCardFields {
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
    queryClient.invalidateQueries({ queryKey: ["transactions-stats"] });
    queryClient.invalidateQueries({ queryKey: ["transfers"] });
  }

  async function createWallet(payload: CreateWalletPayload) {
    await api.post("/bank-accounts", payload);
    invalidate();
  }

  async function updateWallet(id: string, payload: UpdateWalletPayload) {
    await api.patch(`/bank-accounts/${id}`, payload);
    invalidate();
  }

  /** Corrige o saldo para `balanceInCents`; a diferença vira um lançamento de ajuste. */
  async function adjustBalance(id: string, balanceInCents: number) {
    await api.post(`/bank-accounts/${id}/adjust-balance`, { balance: balanceInCents / 100 });
    invalidate();
  }

  async function archiveWallet(id: string) {
    await api.post(`/bank-accounts/${id}/archive`);
    invalidate();
  }

  async function unarchiveWallet(id: string) {
    await api.post(`/bank-accounts/${id}/unarchive`);
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
    adjustBalance,
    archiveWallet,
    unarchiveWallet,
    deleteWallet,
    createTransfer,
    refetch: () => invalidate(),
  };
}
