"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  Trash2,
  Trophy,
  Clock,
  CalendarCheck,
  ArrowLeftRight,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/hooks/useNotifications";

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

const TYPE_LABELS: Record<string, string> = {
  goalAchieved: "Meta atingida",
  goalDeadline: "Prazo de meta",
  scheduledReminder: "Agendamento",
  transferCreated: "Transferência",
};

interface NotificationsTableProps {
  notifications: AppNotification[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleAll?: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
}

const TH =
  "h-11 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap";

export function NotificationsTable({
  notifications,
  selected,
  onToggle,
  allSelected,
  someSelected,
  onToggleAll,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: NotificationsTableProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
          <Bell className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500">Nenhuma notificação ainda</p>
        <p className="text-xs text-slate-400">Quando algo importante acontecer, você verá aqui.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[380px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className={`${TH} pl-6 pr-3 w-[52px]`}>
              <Checkbox
                checked={allSelected ?? false}
                indeterminate={someSelected}
                onCheckedChange={onToggleAll}
              />
            </th>
            <th className={`${TH} pl-6 pr-4`}>Notificação</th>
            <th className={`${TH} px-4 w-[140px] hidden md:table-cell`}>Tipo</th>
            <th className={`${TH} px-4 w-[110px] hidden sm:table-cell`}>Status</th>
            <th className={`${TH} pl-4 pr-6 w-[140px] hidden lg:table-cell`}>Recebida</th>
            <th className="h-11 pr-4 w-[96px]" />
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            const iconColor = TYPE_ICON_COLORS[n.type] ?? "bg-slate-100 text-slate-500";
            const typeLabel = TYPE_LABELS[n.type] ?? "Notificação";
            const isSelected = selected.has(n.id);

            return (
              <tr
                key={n.id}
                className={cn(
                  "group border-b border-slate-50 transition-colors",
                  isSelected ? "bg-[#1E1E2D]/[0.03]" : "hover:bg-slate-50/60",
                  !n.read && !isSelected && "bg-slate-50/40",
                )}
              >
                {/* Checkbox */}
                <td className="pl-6 pr-3 py-4 align-middle w-[52px]">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(n.id)}
                  />
                </td>

                {/* Title / Body */}
                <td className="pl-6 pr-4 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full shrink-0 flex items-center justify-center",
                        iconColor,
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm truncate max-w-[280px]",
                          n.read ? "font-medium text-slate-600" : "font-semibold text-slate-800",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[280px] mt-0.5">
                        {n.body}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Type badge */}
                <td className="px-4 py-4 align-middle w-[140px] hidden md:table-cell">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap",
                      iconColor,
                    )}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    {typeLabel}
                  </span>
                </td>

                {/* Status badge */}
                <td className="px-4 py-4 align-middle w-[110px] hidden sm:table-cell">
                  {n.read ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 whitespace-nowrap">
                      Lida
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 whitespace-nowrap">
                      Não lida
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="pl-4 pr-6 py-4 align-middle text-xs text-slate-500 whitespace-nowrap w-[140px] hidden lg:table-cell">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                </td>

                {/* Actions */}
                <td className="pr-4 py-4 align-middle w-[96px]">
                  <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {n.read ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        onClick={() => onMarkUnread(n.id)}
                        title="Marcar como não lida"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        onClick={() => onMarkRead(n.id)}
                        title="Marcar como lida"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setConfirmId(n.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        title="Excluir notificação"
        description="Essa ação não pode ser desfeita. A notificação será removida permanentemente."
        confirmLabel="Excluir"
        onConfirm={() => { if (confirmId) { onDelete(confirmId); setConfirmId(null); } }}
      />
    </>
  );
}
