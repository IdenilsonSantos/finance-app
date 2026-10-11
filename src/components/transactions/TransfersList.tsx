"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeftRight, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/format";
import { BankAccountResponse, TransferResponse } from "@/types/api";

interface TransfersListProps {
  transfers: TransferResponse[];
  bankAccounts: BankAccountResponse[];
  loading?: boolean;
  onEdit?: (transfer: TransferResponse) => void;
  onDelete: (id: string) => Promise<void>;
}

function AccountBadge({ account }: { account?: BankAccountResponse }) {
  const color = account?.color ?? "#64748b";
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap max-w-[140px] truncate"
      style={{ backgroundColor: color + "22", color }}
    >
      {account?.name ?? "Conta removida"}
    </span>
  );
}

export function TransfersList({ transfers, bankAccounts, loading, onEdit, onDelete }: TransfersListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const accountById = (id: string) => bankAccounts.find((a) => a.id === id);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
      toast.success("Transferência excluída e saldos revertidos");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir transferência");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (!loading && transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <ArrowLeftRight className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-700">Nenhuma transferência encontrada</p>
        <p className="text-xs text-slate-400 mt-1">
          Transferências entre suas contas não contam como receita nem despesa
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-slate-50">
        {transfers.map((t) => (
          <li key={t.id} className="group flex items-center gap-3 px-6 py-4 hover:bg-slate-50/60">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {t.description || "Transferência entre contas"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <AccountBadge account={accountById(t.fromAccountId)} />
                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                <AccountBadge account={accountById(t.toAccountId)} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold tabular-nums text-sm text-slate-700">{formatCurrency(t.amount)}</p>
              <p className="text-xs text-slate-400">
                {format(new Date(t.date + "T12:00:00"), "dd 'de' MMM.", { locale: ptBR })}
              </p>
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar transferência"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(t)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir transferência"
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={() => setConfirmId(t.id)}
              disabled={deletingId === t.id}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Excluir transferência"
        description="Os saldos das duas contas serão revertidos. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={!!deletingId}
        onConfirm={() => {
          if (confirmId) void handleDelete(confirmId);
        }}
      />
    </>
  );
}
