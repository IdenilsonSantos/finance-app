"use client";

import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { TransactionResponse, BankAccountResponse, PaginatedResponse } from "@/types/api";

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

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
  category?: string;
  accountId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function buildParams(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString();
}

export function useTransactions(filters: TransactionFilters = {}) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  // Paginated table query — all filters applied
  const tableParams = buildParams({ ...filters, limit: filters.limit ?? 20 });
  const txQuery = useQuery<PaginatedResponse<TransactionResponse>>({
    queryKey: ["transactions", workspaceId, tableParams],
    queryFn: () =>
      api.get<PaginatedResponse<TransactionResponse>>(`/transactions?${tableParams}`),
    enabled: !!workspaceId,
    placeholderData: keepPreviousData,
  });

  // Stats query — only date range, no type/category/search filter, limit=500
  // Used for income/expense totals and active dates on MonthDateStrip
  const statsParams = buildParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: 500,
  });
  const statsQuery = useQuery<PaginatedResponse<TransactionResponse>>({
    queryKey: ["transactions-stats", workspaceId, statsParams],
    queryFn: () =>
      api.get<PaginatedResponse<TransactionResponse>>(`/transactions?${statsParams}`),
    enabled: !!workspaceId && !!(filters.startDate || filters.endDate),
  });

  const accountsQuery = useQuery<BankAccountResponse[]>({
    queryKey: ["bank-accounts", workspaceId],
    queryFn: () => api.get<BankAccountResponse[]>("/bank-accounts"),
    enabled: !!workspaceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["transactions-stats"] });
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

  const statsTransactions = statsQuery.data?.data ?? [];
  const monthIncome = statsTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = statsTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return {
    transactions: txQuery.data?.data ?? [],
    total: txQuery.data?.total ?? 0,
    page: txQuery.data?.page ?? 1,
    totalPages: txQuery.data?.totalPages ?? 1,
    statsTransactions,
    monthIncome,
    monthExpense,
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
