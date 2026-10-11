"use client";

import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import {
  TransactionResponse,
  TransactionStatus,
  TransactionsSummaryResponse,
  BankAccountResponse,
  PaginatedResponse,
} from "@/types/api";

export interface CreateTransactionPayload {
  bankAccountId: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  beneficiary?: string;
  paymentMethod?: string;
  date: string;
  /** Cartão de crédito: `amount` é o total, dividido em N parcelas mensais. */
  installments?: number;
  status?: TransactionStatus;
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
  status?: TransactionStatus;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
  category?: string;
  accountId?: string;
  search?: string;
  status?: TransactionStatus;
  /** `asc` = ordem de vencimento (usado na lista de pendências). */
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  /** Intervalo usado para os totais de receitas/despesas do mês nos cards.
   * Independente de `startDate`/`endDate`, que podem estar restritos a um
   * único dia selecionado na tela — os cards devem sempre refletir o mês. */
  statsStartDate?: string;
  statsEndDate?: string;
}

function buildParams(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.order) params.set("order", filters.order);
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

  // Period summary (income/expense totals and active dates on MonthDateStrip),
  // aggregated by the API. Uses statsStartDate/statsEndDate (the full month)
  // when provided, so narrowing the table to a single day doesn't skew the
  // "(Mês)" cards. Balance adjustments are excluded server-side.
  const statsStartDate = filters.statsStartDate ?? filters.startDate;
  const statsEndDate = filters.statsEndDate ?? filters.endDate;
  const statsParams = buildParams({
    startDate: statsStartDate,
    endDate: statsEndDate,
    accountId: filters.accountId,
  });
  const statsQuery = useQuery<TransactionsSummaryResponse>({
    queryKey: ["transactions-stats", workspaceId, statsParams],
    queryFn: () =>
      api.get<TransactionsSummaryResponse>(`/transactions/summary?${statsParams}`),
    enabled: !!workspaceId && !!(statsStartDate || statsEndDate),
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
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  async function createTransaction(data: CreateTransactionPayload) {
    await api.post("/transactions", data);
    invalidate();
  }

  async function updateTransaction(id: string, data: UpdateTransactionPayload) {
    await api.patch(`/transactions/${id}`, data);
    invalidate();
  }

  /** Baixa em CSV as transações dos filtros atuais (todas as páginas). */
  async function exportCsv() {
    const params = buildParams({ ...filters, page: undefined, limit: undefined });
    await api.download(`/transactions/export?${params}`, "transacoes.csv");
  }

  /**
   * Converte em transferência (ex.: aplicação/resgate lançado como despesa).
   * Sem conta, usa a conta de investimento vinculada (criada se preciso).
   */
  async function convertToTransfer(id: string, counterpartAccountId?: string) {
    await api.post(`/transactions/${id}/convert-to-transfer`, counterpartAccountId ? { counterpartAccountId } : {});
    invalidate();
    queryClient.invalidateQueries({ queryKey: ["transfers"] });
  }

  /** `installments` exclui todas as parcelas da compra. */
  async function deleteTransaction(id: string, scope: "single" | "installments" = "single") {
    await api.delete(`/transactions/${id}${scope === "installments" ? "?scope=installments" : ""}`);
    invalidate();
  }

  const summary = statsQuery.data;

  return {
    transactions: txQuery.data?.data ?? [],
    total: txQuery.data?.total ?? 0,
    page: txQuery.data?.page ?? 1,
    totalPages: txQuery.data?.totalPages ?? 1,
    monthIncome: summary?.income ?? 0,
    monthExpense: summary?.expense ?? 0,
    incomeCount: summary?.incomeCount ?? 0,
    expenseCount: summary?.expenseCount ?? 0,
    pendingIncome: summary?.pendingIncome ?? 0,
    pendingExpense: summary?.pendingExpense ?? 0,
    overdueCount: summary?.overdueCount ?? 0,
    activeDates: summary?.activeDates ?? [],
    bankAccounts: accountsQuery.data ?? [],
    loading: txQuery.isLoading || accountsQuery.isLoading,
    error: txQuery.error
      ? (txQuery.error instanceof Error ? txQuery.error.message : "Erro ao carregar dados")
      : null,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    convertToTransfer,
    exportCsv,
    refetch: () => invalidate(),
  };
}
