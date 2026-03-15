"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { WorkspaceResponse } from "@/types/api";

type WorkspacesContextValue = {
  workspaces: WorkspaceResponse[];
  loading: boolean;
  currentWorkspaceId: string | null | undefined;
  switchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<WorkspaceResponse>;
  deleteWorkspace: (id: string) => Promise<void>;
  refetch: () => void;
};

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

export function WorkspacesProvider({ children }: { children: ReactNode }) {
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

  const createWorkspace = useCallback(async (name: string) => {
    const workspace = await api.post<WorkspaceResponse>("/workspaces", { name });
    setWorkspaces((prev) => [...prev, workspace]);
    return workspace;
  }, []);

  const deleteWorkspace = useCallback(async (id: string) => {
    await api.delete(`/workspaces/${id}`);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <WorkspacesContext.Provider
      value={{
        workspaces,
        loading,
        currentWorkspaceId: session?.workspaceId,
        switchWorkspace,
        createWorkspace,
        deleteWorkspace,
        refetch: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspacesContext.Provider>
  );
}

export function useWorkspacesContext() {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) throw new Error("useWorkspacesContext must be used within WorkspacesProvider");
  return ctx;
}
