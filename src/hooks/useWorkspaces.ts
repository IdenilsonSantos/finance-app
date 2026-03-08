"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { WorkspaceResponse } from "@/types/api";

export function useWorkspaces() {
  const { data: session, update } = useSession();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(() => {
    setLoading(true);
    api
      .get<WorkspaceResponse[]>("/workspaces/mine")
      .then(setWorkspaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      await update({ workspaceId });
    },
    [update],
  );

  const createWorkspace = useCallback(
    async (name: string) => {
      const workspace = await api.post<WorkspaceResponse>("/workspaces", { name });
      setWorkspaces((prev) => [...prev, workspace]);
      await update({ workspaceId: workspace.id });
      return workspace;
    },
    [update],
  );

  return {
    workspaces,
    loading,
    currentWorkspaceId: session?.workspaceId,
    switchWorkspace,
    createWorkspace,
    refetch: fetchWorkspaces,
  };
}
