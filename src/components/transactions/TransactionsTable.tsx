"use client";

import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, FileText, User, Landmark, QrCode, CreditCard, Wallet, Banknote, ArrowLeftRight, Barcode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { TransactionResponse, BankAccountResponse } from "@/types/api";

interface TransactionsTableProps {
  transactions: TransactionResponse[];
  bankAccounts: BankAccountResponse[];
  deletingId: string | null;
  onEdit: (tx: TransactionResponse) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
  emptySubtitle?: string;
  emptyIcon?: LucideIcon;
}

const ROW_HEIGHT = 64;
const TABLE_HEIGHT = 480;

const PAYMENT_METHODS: Record<string, { label: string; Icon: LucideIcon }> = {
  pix: { label: "Pix", Icon: QrCode },
  credit_card: { label: "Crédito", Icon: CreditCard },
  debit_card: { label: "Débito", Icon: Wallet },
  cash: { label: "Dinheiro", Icon: Banknote },
  transfer: { label: "Transferência", Icon: ArrowLeftRight },
  boleto: { label: "Boleto", Icon: Barcode },
};

export function TransactionsTable({
  transactions,
  bankAccounts,
  deletingId,
  onEdit,
  onDelete,
  emptyMessage,
  emptySubtitle,
  emptyIcon: EmptyIcon = FileText,
}: TransactionsTableProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
          <EmptyIcon className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500">
          {emptyMessage ?? "Nenhuma transação encontrada"}
        </p>
        <p className="text-xs text-slate-400">
          {emptySubtitle ?? "Tente ajustar os filtros ou crie uma nova transação"}
        </p>
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div>
      {/* Sticky header */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="h-11 pl-6 pr-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Descrição / Beneficiário
            </th>
            <th className="h-11 px-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[160px]">
              Categoria
            </th>
            <th className="h-11 px-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[160px] hidden md:table-cell">
              Pagamento
            </th>
            <th className="h-11 px-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[160px]">
              Valor
            </th>
            <th className="h-11 pl-4 pr-6 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[110px] hidden lg:table-cell">
              Data
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
                const tx = transactions[virtualRow.index];
                const catStyle = getCategoryStyle(tx.category);
                const account = bankAccounts.find((a) => a.id === tx.bankAccountId);
                const isDeleting = deletingId === tx.id;

                return (
                  <tr
                    key={tx.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="group border-b border-slate-50 hover:bg-slate-50/60 transition-colors animate-[fadeSlideIn_0.25s_ease_both]"
                    style={{ animationDelay: `${Math.min(virtualRow.index, 12) * 35}ms` }}
                  >
                    {/* Description */}
                    <td className="pl-6 pr-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                          {(tx.beneficiary || tx.description) ? (
                            <span className="text-[11px] font-bold text-slate-600 uppercase leading-none">
                              {(tx.beneficiary || tx.description)!
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")}
                            </span>
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {tx.description || tx.beneficiary || (
                              <span className="text-slate-300 font-normal italic">—</span>
                            )}
                          </p>
                          {tx.description && tx.beneficiary && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {tx.beneficiary}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category badge */}
                    <td className="px-4 py-4 align-middle w-[160px]">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: catStyle.color + "22",
                          color: catStyle.color,
                        }}
                      >
                        {catStyle.label}
                      </span>
                    </td>

                    {/* Payment badge */}
                    <td className="px-4 py-4 align-middle w-[160px] hidden md:table-cell">
                      {tx.paymentMethod ? (() => {
                        const pm = PAYMENT_METHODS[tx.paymentMethod];
                        const Icon = pm?.Icon ?? Landmark;
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-slate-100 text-slate-600">
                            <Icon className="w-3 h-3 shrink-0" />
                            {pm?.label ?? tx.paymentMethod}
                          </span>
                        );
                      })() : account ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                          style={{
                            backgroundColor: account.color + "22",
                            color: account.color,
                          }}
                        >
                          <Landmark className="w-3 h-3 shrink-0" />
                          {account.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4 align-middle text-right w-[160px]">
                      <span
                        className={`font-bold tabular-nums text-sm whitespace-nowrap ${
                          tx.type === "income" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {tx.type === "income" ? "+ " : "- "}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="pl-4 pr-6 py-4 align-middle text-xs text-slate-500 whitespace-nowrap w-[110px] hidden lg:table-cell">
                      {format(new Date(tx.date + "T12:00:00"), "dd 'de' MMM.", {
                        locale: ptBR,
                      })}
                    </td>

                    {/* Actions */}
                    <td className="pr-4 py-4 align-middle w-[80px]">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => onEdit(tx)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmId(tx.id)}
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
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        title="Excluir transação"
        description="Essa ação não pode ser desfeita. A transação será removida permanentemente"
        onConfirm={() => { if (confirmId) { onDelete(confirmId); setConfirmId(null); } }}
        loading={deletingId === confirmId}
      />
    </div>
  );
}
