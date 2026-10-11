"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { CategoryResponse } from "@/types/api";
import { categoryOptions, registerCustomCategories } from "@/lib/categories";

export interface CategoryPayload {
  name: string;
  type?: "income" | "expense";
  color: string;
  icon: string;
}

const EMPTY: CategoryResponse[] = [];

/**
 * Categorias personalizadas do workspace. Chame nas páginas que exibem
 * categorias: além de carregar a lista, faz a página renderizar de novo
 * quando ela chega, para nomes/cores aparecerem certos em toda a árvore.
 */
export function useCategories() {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CategoryResponse[]>({
    queryKey: ["categories", workspaceId],
    queryFn: () => api.get<CategoryResponse[]>("/categories"),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
  const categories = data ?? EMPTY;

  // Registra antes de os filhos renderizarem (getCategoryStyle lê o registro).
  useMemo(() => registerCustomCategories(categories), [categories]);

  function invalidate() {
    for (const key of ["categories", "transactions", "transactions-stats", "budgets", "dashboard", "scheduled-transactions"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }

  async function createCategory(payload: CategoryPayload) {
    const created = await api.post<CategoryResponse>("/categories", payload);
    invalidate();
    return created;
  }

  async function updateCategory(id: string, payload: Omit<CategoryPayload, "type">) {
    await api.patch(`/categories/${id}`, payload);
    invalidate();
  }

  /** Exclui movendo os lançamentos para `replaceWith`. */
  async function deleteCategory(id: string, replaceWith: string) {
    const result = await api.delete<{ movedTransactions: number }>(
      `/categories/${id}?replaceWith=${encodeURIComponent(replaceWith)}`,
    );
    invalidate();
    return result;
  }

  return {
    categories,
    loading: isLoading,
    options: categoryOptions,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
