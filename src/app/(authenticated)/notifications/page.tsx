"use client";

import { Header } from "@/components/Header";
import { useNotifications } from "@/hooks/useNotifications";
import { Pagination } from "@/components/ui/Pagination";
import { NotificationsTable } from "@/components/notifications/NotificationsTable";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

function NotificationsSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50">
        <Pulse className="h-5 w-40 mb-1" />
        <Pulse className="h-3.5 w-20 mt-2" />
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Pulse className="w-4 h-4 rounded shrink-0" />
            <Pulse className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-3.5 w-48" />
              <Pulse className="h-2.5 w-72" />
            </div>
            <Pulse className="h-6 w-16 rounded-full hidden md:block" />
            <Pulse className="h-6 w-14 rounded-full hidden sm:block" />
            <Pulse className="h-3 w-20 hidden lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

const LIMIT = 20;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const {
    notifications,
    total,
    totalPages,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    deleteOne,
    refetch,
  } = useNotifications(page, LIMIT);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<"selected" | null>(null);

  const allSelected = notifications.length > 0 && selected.size === notifications.length;
  const someSelected = selected.size > 0 && !allSelected;
  const hasSelection = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map((n) => n.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    await Promise.all([...selected].map((id) => deleteOne(id)));
    setSelected(new Set());
    setConfirmDelete(null);
    const newTotal = Math.max(0, total - selected.size);
    const newTotalPages = Math.max(1, Math.ceil(newTotal / LIMIT));
    if (page > newTotalPages) {
      setPage(newTotalPages); // useEffect vai refetch automaticamente
    } else {
      refetch(); // mesma página, precisa buscar os dados frescos
    }
  }

  async function handleMarkSelectedRead() {
    await Promise.all([...selected].map((id) => markAsRead(id)));
    setSelected(new Set());
  }

  async function handleMarkSelectedUnread() {
    await Promise.all([...selected].map((id) => markAsUnread(id)));
    setSelected(new Set());
  }

  const selectedHasUnread = [...selected].some(
    (id) => !notifications.find((n) => n.id === id)?.read,
  );
  const selectedHasRead = [...selected].some(
    (id) => notifications.find((n) => n.id === id)?.read,
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <Header
          title="Notificações"
          subtitle="Acompanhe suas atualizações em tempo real"
        />
        <div className="flex-1 p-4 md:p-8">
          <NotificationsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header
        title="Notificações"
        subtitle="Acompanhe suas atualizações em tempo real"
        actions={
          unreadCount > 0 ? (
            <Button
              onClick={markAllAsRead}
              size="sm"
              className="gap-2 rounded-2xl bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar tudo como lido
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-4 md:p-8">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Todas as notificações</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
              </p>
            </div>

            {hasSelection && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                <span className="hidden sm:inline text-xs text-slate-400 font-medium">
                  {selected.size} {selected.size === 1 ? "selecionada" : "selecionadas"}
                </span>
                <div className="hidden sm:block w-px h-4 bg-slate-200" />
                {selectedHasUnread && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSelectedRead}
                    className="h-8 gap-1.5 rounded-2xl border-slate-200 text-slate-600 font-semibold text-xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Marcar como lida</span>
                  </Button>
                )}
                {selectedHasRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSelectedUnread}
                    className="h-8 gap-1.5 rounded-2xl border-slate-200 text-slate-600 font-semibold text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 rotate-45 opacity-0 absolute" />
                    <CheckCheck className="w-3.5 h-3.5 opacity-50" />
                    <span className="hidden sm:inline">Marcar como não lida</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete("selected")}
                  className="h-8 gap-1.5 rounded-2xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excluir</span>
                </Button>
              </div>
            )}
          </div>

          <>
              <NotificationsTable
                notifications={notifications}
                selected={selected}
                onToggle={toggleOne}
                allSelected={allSelected}
                someSelected={someSelected}
                onToggleAll={toggleAll}
                onMarkRead={markAsRead}
                onMarkUnread={markAsUnread}
                onDelete={deleteOne}
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={LIMIT}
                onPageChange={(p) => { setPage(p); setSelected(new Set()); }}
              />
            </>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete === "selected"}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Excluir notificações"
        description={`${selected.size} ${selected.size === 1 ? "notificação será removida" : "notificações serão removidas"} permanentemente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}
