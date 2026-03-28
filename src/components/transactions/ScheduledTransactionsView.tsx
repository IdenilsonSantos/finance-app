"use client";

import { useState } from "react";
import { CalendarDays, Play, Pencil, Trash2, Loader2, RepeatIcon, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { ScheduledTransactionResponse, BankAccountResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const FREQUENCY_LABELS: Record<string, string> = {
  once: "Uma vez",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

interface Props {
  scheduled: ScheduledTransactionResponse[];
  bankAccounts: BankAccountResponse[];
  onEdit: (item: ScheduledTransactionResponse) => void;
  onDelete: (id: string) => Promise<void>;
  onExecute: (id: string) => Promise<void>;
}

function getNextDateLabel(nextDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(nextDate + "T00:00:00");
  const diff = differenceInDays(target, today);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff < 0) return "vencida";
  return `em ${diff} dias`;
}

function isCompleted(item: ScheduledTransactionResponse): boolean {
  return item.nextDate === null;
}

export function ScheduledTransactionsView({ scheduled, bankAccounts, onEdit, onDelete, onExecute }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
      toast.success("Agendamento excluído");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir agendamento");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  async function handleExecute(id: string) {
    setExecutingId(id);
    try {
      await onExecute(id);
      toast.success("Transação executada com sucesso");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao executar agendamento");
    } finally {
      setExecutingId(null);
    }
  }

  if (scheduled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="p-4 bg-slate-100 rounded-2xl">
          <CalendarDays className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Nenhum agendamento encontrado</p>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Crie um agendamento e ele será executado automaticamente todo dia à meia-noite
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {scheduled.map((item) => {
        const catStyle = getCategoryStyle(item.category);
        const Icon = catStyle.icon;
        const account = bankAccounts.find((a) => a.id === item.bankAccountId);
        const isExecuting = executingId === item.id;
        const isDeleting = deletingId === item.id;
        const completed = isCompleted(item);
        const nextDateLabel = item.nextDate ? getNextDateLabel(item.nextDate) : null;
        const isOverdue = nextDateLabel === "vencida";
        const lastExecutedLabel = item.lastExecutedAt
          ? format(parseISO(item.lastExecutedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
          : null;

        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-4 px-6 py-4 transition-colors",
              completed ? "opacity-60 hover:bg-slate-50/40" : "hover:bg-slate-50/60",
            )}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: catStyle.color + "20" }}
            >
              <Icon className="w-4 h-4" style={{ color: catStyle.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {item.description || catStyle.label}
                </p>
                {completed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Concluída
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-slate-400">{account?.name ?? "—"}</span>
                <span className="text-slate-200">·</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <RepeatIcon className="w-3 h-3" />
                  {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
                </span>
                {lastExecutedLabel && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      Executada em {lastExecutedLabel}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className={cn(
                  "text-sm font-bold",
                  item.type === "income" ? "text-emerald-600" : "text-red-500",
                )}>
                  {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                </p>
                {!completed && nextDateLabel && (
                  <p className={cn(
                    "text-[11px] mt-0.5",
                    isOverdue ? "text-red-400 font-medium" : "text-slate-400",
                  )}>
                    próx. {nextDateLabel}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {!completed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleExecute(item.id)}
                        disabled={isExecuting || isDeleting}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                      >
                        {isExecuting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Executar agora</TooltipContent>
                  </Tooltip>
                )}
                {!completed && (
                  <button
                    onClick={() => onEdit(item)}
                    disabled={isExecuting || isDeleting}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setConfirmId(item.id)}
                  disabled={isExecuting || isDeleting}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <ConfirmDialog
              open={confirmId === item.id}
              onOpenChange={(o) => !o && setConfirmId(null)}
              title="Excluir agendamento"
              description="Esse agendamento será removido permanentemente. As transações já executadas não serão afetadas."
              onConfirm={() => handleDelete(item.id)}
              loading={isDeleting}
            />
          </div>
        );
      })}
    </div>
  );
}
