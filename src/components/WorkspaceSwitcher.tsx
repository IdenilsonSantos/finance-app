"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Plus, Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { toast } from "sonner";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const { workspaces, loading, currentWorkspaceId, switchWorkspace, createWorkspace } =
    useWorkspaces();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const current = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];

  const handleSwitch = async (id: string) => {
    if (id === currentWorkspaceId) return;
    setSwitching(id);
    try {
      await switchWorkspace(id);
      toast.success("Workspace alterado");
    } catch {
      toast.error("Erro ao trocar workspace");
    } finally {
      setSwitching(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createWorkspace(newName.trim());
      toast.success("Workspace criado");
      setNewName("");
      setShowInput(false);
    } catch {
      toast.error("Erro ao criar workspace");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-10">
        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full h-10 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all",
            collapsed ? "justify-center px-0" : "justify-between px-3 gap-2",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-[#1E1E2D] flex items-center justify-center shrink-0">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xs font-semibold text-slate-700 truncate">
                {current?.name ?? "Workspace"}
              </span>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" className="w-56 rounded-2xl p-1.5 z-[100]">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2 pb-1">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-1" />

        <ScrollArea className={workspaces.length > 3 ? "h-[144px]" : undefined}>
          <div className={workspaces.length > 3 ? "pr-3" : undefined}>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => handleSwitch(ws.id)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-[#1E1E2D] flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-bold">
                  {ws.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                {ws.name}
              </span>
              {switching === ws.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : ws.id === currentWorkspaceId ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : null}
            </DropdownMenuItem>
          ))}
          </div>
        </ScrollArea>

        <DropdownMenuSeparator className="my-1" />

        {showInput ? (
          <div
            className="px-2 py-1.5 space-y-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setShowInput(false); setNewName(""); }
              }}
              placeholder="Nome do workspace"
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-gray-400 outline-none bg-white"
            />
            <div className="flex gap-1.5">
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 text-xs font-semibold bg-[#1E1E2D] text-white rounded-xl py-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Criar"}
              </button>
              <button
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => { setShowInput(false); setNewName(""); }}
                className="flex-1 text-xs font-medium text-slate-500 rounded-xl py-1.5 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => setShowInput(true)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer text-slate-500 hover:text-[#1E1E2D]"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-sm font-medium">Novo workspace</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
