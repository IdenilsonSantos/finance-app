"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { WorkspaceMemberResponse, WorkspaceMemberRole } from "@/types/api";

export function useWorkspaceMembers(workspaceId: string | undefined) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const queryKey = ["workspace-members", workspaceId];

  const { data: members = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => api.get<WorkspaceMemberResponse[]>(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const inviteMember = useCallback(
    async (email: string, role: "admin" | "member") => {
      await api.post(`/workspaces/${workspaceId}/members/invite`, { email, role });
    },
    [workspaceId],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      queryClient.setQueryData<WorkspaceMemberResponse[]>(queryKey, (prev) =>
        prev ? prev.filter((m) => m.id !== memberId) : [],
      );
    },
    [workspaceId, queryClient],
  );

  const updateRole = useCallback(
    async (memberId: string, role: "admin" | "member") => {
      await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
      queryClient.setQueryData<WorkspaceMemberResponse[]>(queryKey, (prev) =>
        prev
          ? prev.map((m) => (m.id === memberId ? { ...m, role: role as WorkspaceMemberRole } : m))
          : [],
      );
    },
    [workspaceId, queryClient],
  );

  const leaveWorkspace = useCallback(async () => {
    await api.post(`/workspaces/${workspaceId}/leave`, {});
  }, [workspaceId]);

  const currentUserId = session?.user?.id as string | undefined;
  const currentMember = members.find((m) => m.user?.id === currentUserId);
  const currentRole = currentMember?.role ?? "member";

  return {
    members,
    loading,
    currentRole,
    currentUserId,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
    inviteMember,
    removeMember,
    updateRole,
    leaveWorkspace,
  };
}
