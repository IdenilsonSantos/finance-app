"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { GoalResponse } from "@/types/api";

export interface CreateGoalPayload {
  name: string;
  targetAmount: number;
  deadline?: string;
  color?: string;
}

export interface UpdateGoalPayload {
  name?: string;
  targetAmount?: number;
  deadline?: string | null;
  color?: string;
}

export function useGoals() {
  const { data: session } = useSession();
  const workspaceId = session?.workspaceId;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<GoalResponse[]>({
    queryKey: ["goals", workspaceId],
    queryFn: () => api.get<GoalResponse[]>("/goals"),
    enabled: !!workspaceId,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  async function createGoal(payload: CreateGoalPayload) {
    await api.post("/goals", {
      ...payload,
      targetAmount: payload.targetAmount / 100,
    });
    invalidate();
  }

  async function updateGoal(id: string, payload: UpdateGoalPayload) {
    await api.patch(`/goals/${id}`, {
      ...payload,
      ...(payload.targetAmount !== undefined
        ? { targetAmount: payload.targetAmount / 100 }
        : {}),
    });
    invalidate();
  }

  async function deleteGoal(id: string) {
    await api.delete(`/goals/${id}`);
    invalidate();
  }

  async function contributeGoal(id: string, amountInCents: number) {
    await api.post(`/goals/${id}/contribute`, { amount: amountInCents / 100 });
    invalidate();
  }

  return {
    goals: data ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Erro ao carregar metas") : null,
    createGoal,
    updateGoal,
    deleteGoal,
    contributeGoal,
  };
}
