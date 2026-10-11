"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { InvoiceResponse } from "@/types/api";

/** Fatura do cartão. Sem `month`, a API devolve a fatura em aberto. */
export function useInvoice(accountId: string | null, month?: string) {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const query = month ? `?month=${month}` : "";

  const { data, isLoading, error } = useQuery<InvoiceResponse>({
    // Inclui "bank-accounts" na chave para revalidar junto com saldos/transferências.
    queryKey: ["bank-accounts", workspaceId, "invoice", accountId, month ?? "current"],
    queryFn: () => api.get<InvoiceResponse>(`/bank-accounts/${accountId}/invoices${query}`),
    enabled: !!workspaceId && !!accountId,
  });

  return {
    invoice: data ?? null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar fatura") : null,
  };
}
