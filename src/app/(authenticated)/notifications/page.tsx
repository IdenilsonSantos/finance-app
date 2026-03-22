"use client";

import { Header } from "@/components/Header";
import { useNotificationsContext as useNotifications } from "@/components/providers/NotificationsContext";
import type { AppNotification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCheck,
  Loader2,
  Trash2,
  Trophy,
  Clock,
  CalendarCheck,
  ArrowLeftRight,
  LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";

const TYPE_ICONS: Record<string, LucideIcon> = {
  goalAchieved: Trophy,
  goalDeadline: Clock,
  scheduledReminder: CalendarCheck,
  transferCreated: ArrowLeftRight,
};

const TYPE_ICON_COLORS: Record<string, string> = {
  goalAchieved: "bg-emerald-100 text-emerald-600",
  goalDeadline: "bg-amber-100 text-amber-600",
  scheduledReminder: "bg-blue-100 text-blue-600",
  transferCreated: "bg-violet-100 text-violet-600",
};


function NotificationRow({
  notification,
  selected,
  onToggle,
}: {
  notification: AppNotification;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const iconColor = TYPE_ICON_COLORS[notification.type] ?? "bg-slate-100 text-slate-500";
  const unread = !notification.read;

  return (
    <div
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all cursor-pointer",
        selected
          ? "bg-[#1E1E2D]/5"
          : unread
          ? "bg-slate-50 hover:bg-slate-100/70"
          : "hover:bg-slate-50 opacity-60",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />

      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
        <Icon size={17} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", unread ? "font-semibold text-slate-800" : "font-medium text-slate-600")}>
          {notification.title}
        </p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{notification.body}</p>
        <p className="text-[10px] text-slate-300 font-mono mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    deleteOne,
    deleteRead,
    deleteAll,
  } = useNotifications();

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

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
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

      <div className="flex-1 overflow-hidden p-4 md:p-8">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-50 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                />
              )}
              <div>
                <h2 className="text-base font-bold text-slate-900">Todas as notificações</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
                </p>
              </div>
            </div>

            {hasSelection && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">
                  {selected.size} {selected.size === 1 ? "selecionada" : "selecionadas"}
                </span>
                {selectedHasUnread && (
                  <button
                    onClick={handleMarkSelectedRead}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <CheckCheck size={13} />
                    Lida
                  </button>
                )}
                {selectedHasRead && (
                  <button
                    onClick={handleMarkSelectedUnread}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Bell size={13} />
                    Não lida
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete("selected")}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                  Excluir
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Bell className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-700">Nenhuma notificação ainda</p>
              <p className="text-sm text-slate-400 max-w-xs">
                Quando algo importante acontecer, você verá aqui.
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-0.5">
                {notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    selected={selected.has(n.id)}
                    onToggle={() => toggleOne(n.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
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
