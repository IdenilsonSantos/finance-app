"use client";

import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, FileText, Landmark, QrCode, CreditCard, Wallet, Banknote, ArrowLeftRight, Barcode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TransactionItem {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string | null;
  beneficiary: string | null;
  paymentMethod: string | null;
  date: string;
  bankAccountName: string | null;
  bankAccountColor: string | null;
}

interface TransactionsTableProps {
  transactions: TransactionItem[];
  deletingId?: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  tableHeight?: number;
  /**
   * Simple mode: single table with sticky thead inside a ScrollArea.
   * No virtualizer — best for small lists in fixed-height containers (e.g. dashboard).
   */
  simple?: boolean;
  emptyMessage?: string;
  emptySubtitle?: string;
  emptyIcon?: LucideIcon;
  // Selection
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleAll?: () => void;
}

const ROW_HEIGHT = 64;
const DEFAULT_TABLE_HEIGHT = 480;

const PAYMENT_METHODS: Record<string, { label: string; Icon: LucideIcon }> = {
  pix: { label: "Pix", Icon: QrCode },
  credit_card: { label: "Crédito", Icon: CreditCard },
  debit_card: { label: "Débito", Icon: Wallet },
  cash: { label: "Dinheiro", Icon: Banknote },
  transfer: { label: "Transferência", Icon: ArrowLeftRight },
  boleto: { label: "Boleto", Icon: Barcode },
};

// ─── Shared row cells ────────────────────────────────────────────────────────

function TxCells({
  tx,
  showActions,
  isDeleting,
  onEdit,
  onDeleteClick,
  isSelected,
  onToggle,
}: {
  tx: TransactionItem;
  showActions: boolean;
  isDeleting: boolean;
  onEdit?: (id: string) => void;
  onDeleteClick: (id: string) => void;
  isSelected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const catStyle = getCategoryStyle(tx.category);
  const pm = tx.paymentMethod ? PAYMENT_METHODS[tx.paymentMethod] : null;

  return (
    <>
      {/* Checkbox */}
      {onToggle !== undefined && (
        <td className="pl-6 pr-3 py-4 align-middle w-[52px]">
          <Checkbox
            checked={isSelected ?? false}
            onCheckedChange={() => onToggle(tx.id)}
          />
        </td>
      )}

      {/* Description / Beneficiary */}
      <td className="pl-6 pr-4 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
            style={{ backgroundColor: catStyle.color + "20" }}
          >
            <catStyle.icon className="w-4 h-4" style={{ color: catStyle.color }} />
          </div>
          <div className="min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-semibold text-slate-800 truncate max-w-[200px] cursor-default">
                  {tx.description || tx.beneficiary || (
                    <span className="text-slate-300 font-normal italic">—</span>
                  )}
                </p>
              </TooltipTrigger>
              {(tx.description || tx.beneficiary) && (
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  {tx.description}
                  {tx.description && tx.beneficiary && <br />}
                  {tx.beneficiary}
                </TooltipContent>
              )}
            </Tooltip>
            {tx.description && tx.beneficiary && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px] cursor-default">
                    {tx.beneficiary}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  {tx.beneficiary}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </td>

      {/* Category badge */}
      <td className="px-4 py-4 align-middle w-[160px] hidden sm:table-cell">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
          style={{ backgroundColor: catStyle.color + "22", color: catStyle.color }}
        >
          {catStyle.label}
        </span>
      </td>

      {/* Payment / Account badge */}
      <td className="px-4 py-4 align-middle w-[160px] hidden md:table-cell">
        {pm ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-slate-100 text-slate-600">
            <pm.Icon className="w-3 h-3 shrink-0" />
            {pm.label}
          </span>
        ) : tx.bankAccountName ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
            style={{
              backgroundColor: (tx.bankAccountColor ?? "#64748b") + "22",
              color: tx.bankAccountColor ?? "#64748b",
            }}
          >
            <Landmark className="w-3 h-3 shrink-0" />
            {tx.bankAccountName}
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
        {format(new Date(tx.date + "T12:00:00"), "dd 'de' MMM.", { locale: ptBR })}
      </td>

      {/* Actions */}
      {showActions && (
        <td className="pr-4 py-4 align-middle w-[80px]">
          <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => onEdit(tx.id)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDeleteClick(tx.id)}
              disabled={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </td>
      )}
    </>
  );
}

const TH = "h-11 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap";

function TableHeader({
  showActions,
  sticky,
  allSelected,
  someSelected,
  onToggleAll,
}: {
  showActions: boolean;
  sticky?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onToggleAll?: () => void;
}) {
  const s = sticky ? " sticky top-0 bg-white z-10" : "";
  return (
    <thead>
      <tr className="border-b border-slate-100">
        {onToggleAll !== undefined && (
          <th className={`${TH} pl-6 pr-3 w-[52px]${s}`}>
            <Checkbox
              checked={allSelected ?? false}
              indeterminate={someSelected}
              onCheckedChange={onToggleAll}
            />
          </th>
        )}
        <th className={`${TH} pl-6 pr-4${s}`}>Descrição / Beneficiário</th>
        <th className={`${TH} px-4 w-[160px] hidden sm:table-cell${s}`}>Categoria</th>
        <th className={`${TH} px-4 w-[160px] hidden md:table-cell${s}`}>Pagamento</th>
        <th className={`${TH} px-4 text-right w-[160px]${s}`}>Valor</th>
        <th className={`${TH} pl-4 pr-6 w-[110px] hidden lg:table-cell${s}`}>Data</th>
        {showActions && <th className={`h-11 pr-4 w-[80px]${s}`} />}
      </tr>
    </thead>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TransactionsTable({
  transactions,
  deletingId = null,
  onEdit,
  onDelete,
  tableHeight = DEFAULT_TABLE_HEIGHT,
  simple = false,
  emptyMessage,
  emptySubtitle,
  emptyIcon: EmptyIcon = FileText,
  selected,
  onToggle,
  allSelected,
  someSelected,
  onToggleAll,
}: TransactionsTableProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const showActions = !!(onEdit || onDelete);
  const showSelection = !!(onToggle && onToggleAll);

  const virtualizer = useVirtualizer({
    count: simple ? 0 : transactions.length,
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

  const confirm = onDelete ? (
    <ConfirmDialog
      open={confirmId !== null}
      onOpenChange={(open) => { if (!open) setConfirmId(null); }}
      title="Excluir transação"
      description="Essa ação não pode ser desfeita. A transação será removida permanentemente"
      onConfirm={() => { if (confirmId) { onDelete(confirmId); setConfirmId(null); } }}
      loading={deletingId === confirmId}
    />
  ) : null;

  // ── Simple mode: single table with sticky thead ───────────────────────────
  if (simple) {
    return (
      <>
        <div className="overflow-x-auto">
        <ScrollArea style={{ height: tableHeight }}>
          <table className="w-full min-w-[520px] text-sm border-collapse">
            <TableHeader showActions={showActions} sticky allSelected={allSelected} someSelected={someSelected} onToggleAll={onToggleAll} />
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className={cn(
                    "group border-b border-slate-50 transition-colors",
                    selected?.has(tx.id) ? "bg-[#1E1E2D]/[0.03]" : "hover:bg-slate-50/60",
                  )}
                >
                  <TxCells
                    tx={tx}
                    showActions={showActions}
                    isDeleting={deletingId === tx.id}
                    onEdit={onEdit}
                    onDeleteClick={setConfirmId}
                    isSelected={selected?.has(tx.id)}
                    onToggle={showSelection ? onToggle : undefined}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        </div>
        {confirm}
      </>
    );
  }

  // ── Virtualized mode: split header + body tables ──────────────────────────
  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
      <table className="w-full text-sm border-collapse">
        <TableHeader showActions={showActions} allSelected={allSelected} someSelected={someSelected} onToggleAll={onToggleAll} />
      </table>

      <ScrollArea viewportRef={viewportRef} style={{ height: tableHeight }}>
        <div style={{ height: totalSize, position: "relative" }}>
          <table
            className="w-full text-sm border-collapse"
            style={{ position: "absolute", top: items[0]?.start ?? 0, left: 0, right: 0 }}
          >
            <tbody>
              {items.map((virtualRow) => {
                const tx = transactions[virtualRow.index];
                return (
                  <tr
                    key={tx.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={cn(
                      "group border-b border-slate-50 transition-colors animate-[fadeSlideIn_0.25s_ease_both]",
                      selected?.has(tx.id) ? "bg-[#1E1E2D]/[0.03]" : "hover:bg-slate-50/60",
                    )}
                    style={{ animationDelay: `${Math.min(virtualRow.index, 12) * 35}ms` }}
                  >
                    <TxCells
                      tx={tx}
                      showActions={showActions}
                      isDeleting={deletingId === tx.id}
                      onEdit={onEdit}
                      onDeleteClick={setConfirmId}
                      isSelected={selected?.has(tx.id)}
                      onToggle={showSelection ? onToggle : undefined}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ScrollArea>
      </div>
      {confirm}
    </div>
  );
}
