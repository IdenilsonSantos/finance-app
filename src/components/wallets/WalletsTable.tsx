"use client";

import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Building2,
  PiggyBank,
  Landmark,
  CreditCard,
  Pencil,
  Trash2,
  Wallet,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/format";
import { BankAccountResponse } from "@/types/api";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  investment: Building2,
  cash: CreditCard,
};

const TYPE_LABELS: Record<string, string> = {
  checking: "C. Corrente",
  savings: "Poupança",
  investment: "Investimento",
  cash: "Dinheiro",
};

const TYPE_COLORS: Record<string, string> = {
  checking: "#3b82f6",
  savings: "#22c55e",
  investment: "#a855f7",
  cash: "#f97316",
};

const ROW_HEIGHT = 68;
const TABLE_HEIGHT = 480;

interface WalletsTableProps {
  wallets: BankAccountResponse[];
  deletingId: string | null;
  onEdit: (wallet: BankAccountResponse) => void;
  onDelete: (id: string) => void;
}

export function WalletsTable({ wallets, deletingId, onEdit, onDelete }: WalletsTableProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const virtualizer = useVirtualizer({
    count: wallets.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500">Nenhuma conta encontrada</p>
        <p className="text-xs text-slate-400">Tente ajustar os filtros ou adicione uma nova conta</p>
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[380px]">
      {/* Sticky header */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="h-11 pl-6 pr-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Conta
            </th>
            <th className="h-11 px-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[160px] hidden sm:table-cell">
              Tipo
            </th>
            <th className="h-11 px-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[180px]">
              Saldo
            </th>
            <th className="h-11 pr-4 w-[80px]" />
          </tr>
        </thead>
      </table>

      {/* Virtualized body */}
      <ScrollArea viewportRef={viewportRef} style={{ height: TABLE_HEIGHT }}>
        <div style={{ height: totalSize, position: "relative" }}>
          <table
            className="w-full text-sm border-collapse"
            style={{
              position: "absolute",
              top: items[0]?.start ?? 0,
              left: 0,
              right: 0,
            }}
          >
            <tbody>
              {items.map((virtualRow) => {
                const wallet = wallets[virtualRow.index];
                const Icon = TYPE_ICONS[wallet.type] || Landmark;
                const typeColor = TYPE_COLORS[wallet.type] ?? "#64748b";
                const isDeleting = deletingId === wallet.id;

                return (
                  <tr
                    key={wallet.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="group border-b border-slate-50 hover:bg-slate-50/60 transition-colors animate-[fadeSlideIn_0.25s_ease_both]"
                    style={{ animationDelay: `${Math.min(virtualRow.index, 12) * 35}ms` }}
                  >
                    {/* Account */}
                    <td className="pl-6 pr-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                          style={{ backgroundColor: wallet.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {wallet.name}
                          </p>
                          <p className="text-[11px] text-slate-400 sm:hidden mt-0.5">
                            {TYPE_LABELS[wallet.type] || wallet.type}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-4 align-middle w-[160px] hidden sm:table-cell">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: typeColor + "22",
                          color: typeColor,
                        }}
                      >
                        {TYPE_LABELS[wallet.type] || wallet.type}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-4 align-middle text-right w-[180px]">
                      <span
                        className={cn(
                          "font-bold tabular-nums text-sm whitespace-nowrap",
                          wallet.balance >= 0 ? "text-slate-900" : "text-red-600",
                        )}
                      >
                        {formatCurrency(wallet.balance)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="pr-4 py-4 align-middle w-[80px]">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => onEdit(wallet)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmId(wallet.id)}
                          disabled={isDeleting}
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
      </ScrollArea>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        title="Excluir conta"
        description="Essa ação não pode ser desfeita. A conta e todas as suas transações serão removidas permanentemente."
        onConfirm={() => { if (confirmId) { onDelete(confirmId); setConfirmId(null); } }}
        loading={deletingId === confirmId}
      />
    </div>
  );
}
