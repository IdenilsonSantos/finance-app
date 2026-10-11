"use client";

import { useState } from "react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CreditCard, Loader2, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransferFormDialog } from "@/components/wallets/TransferFormDialog";
import { useInvoice } from "@/hooks/useInvoice";
import { CreateTransferPayload } from "@/hooks/useWallets";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BankAccountResponse, InvoiceStatus } from "@/types/api";

const STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  open: { label: "Aberta", className: "bg-blue-50 text-blue-600" },
  closed: { label: "Fechada", className: "bg-amber-50 text-amber-600" },
  paid: { label: "Paga", className: "bg-emerald-50 text-emerald-600" },
  overdue: { label: "Vencida", className: "bg-red-50 text-red-600" },
};

function day(date: string) {
  return format(new Date(date + "T12:00:00"), "dd MMM", { locale: ptBR });
}

interface Props {
  account: BankAccountResponse | null;
  accounts: BankAccountResponse[];
  onOpenChange: (open: boolean) => void;
  onPay: (data: CreateTransferPayload) => Promise<void>;
}

export function CreditCardInvoiceDialog({ account, accounts, onOpenChange, onPay }: Props) {
  // undefined = fatura em aberto (a API decide qual é).
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [payOpen, setPayOpen] = useState(false);
  const { invoice, loading, error } = useInvoice(account?.id ?? null, month);

  const currentMonth = invoice?.month ?? month;

  function shift(delta: number) {
    if (!currentMonth) return;
    setMonth(format(addMonths(new Date(`${currentMonth}-01T12:00:00`), delta), "yyyy-MM"));
  }

  const status = invoice ? STATUS[invoice.status] : null;
  const usedPercent =
    invoice?.creditLimit ? Math.min(100, Math.round((invoice.usedLimit / invoice.creditLimit) * 100)) : null;

  return (
    <>
      <Dialog
        open={!!account}
        onOpenChange={(o) => {
          if (!o) setMonth(undefined);
          onOpenChange(o);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: account?.color }} />
              Fatura · {account?.name}
            </DialogTitle>
            <p className="text-sm text-slate-400">
              Fecha dia {account?.closingDay} · vence dia {account?.dueDay}
            </p>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => shift(-1)}
              disabled={!currentMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"
              aria-label="Fatura anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-900 capitalize min-w-[140px] text-center">
              {currentMonth
                ? format(new Date(`${currentMonth}-01T12:00:00`), "MMMM 'de' yyyy", { locale: ptBR })
                : "—"}
            </p>
            <button
              onClick={() => shift(1)}
              disabled={!currentMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"
              aria-label="Próxima fatura"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : error || !invoice ? (
            <p className="text-sm text-slate-400 text-center py-10">{error ?? "Fatura indisponível"}</p>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total da fatura</p>
                  {status && (
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold", status.className)}>
                      {status.label}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.total)}</p>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Fecha em {day(invoice.closingDate)}</span>
                  <span>Vence em {day(invoice.dueDate)}</span>
                </div>
                {invoice.paidAmount > 0 && (
                  <p className="text-xs text-slate-500">
                    Pago: <span className="font-semibold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                    {invoice.remaining > 0 && <> · falta {formatCurrency(invoice.remaining)}</>}
                  </p>
                )}
              </div>

              {usedPercent !== null && invoice.creditLimit !== null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Limite utilizado</span>
                    <span>
                      Disponível{" "}
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(invoice.availableLimit ?? 0)}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${usedPercent}%`,
                        backgroundColor: usedPercent >= 90 ? "#ef4444" : usedPercent >= 70 ? "#f59e0b" : "#3b82f6",
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {formatCurrency(invoice.usedLimit)} de {formatCurrency(invoice.creditLimit)}
                  </p>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto pr-1">
                {invoice.transactions.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Receipt className="w-6 h-6 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400">Nenhuma compra nesta fatura</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {invoice.transactions.map((t) => {
                      const style = getCategoryStyle(t.category);
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {t.description || style.label}
                              {t.installmentTotal && t.installmentTotal > 1 && (
                                <span className="text-slate-400 font-normal">
                                  {" "}
                                  ({t.installmentNumber}/{t.installmentTotal})
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{day(t.date)}</p>
                          </div>
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums whitespace-nowrap",
                              t.type === "income" ? "text-emerald-600" : "text-slate-800",
                            )}
                          >
                            {t.type === "income" ? "- " : ""}
                            {formatCurrency(t.amount)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {invoice.status !== "paid" && invoice.status !== "open" && invoice.remaining > 0 && (
                <Button
                  onClick={() => setPayOpen(true)}
                  className="w-full rounded-2xl h-12 bg-[#1E1E2D] text-white hover:bg-slate-800 font-semibold"
                >
                  Pagar fatura · {formatCurrency(invoice.remaining)}
                </Button>
              )}
              {invoice.status === "open" && invoice.remaining > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setPayOpen(true)}
                  className="w-full rounded-2xl h-11 font-semibold border-slate-200"
                >
                  Antecipar pagamento · {formatCurrency(invoice.remaining)}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {account && invoice && (
        <TransferFormDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          accounts={accounts}
          title="Pagar fatura"
          subtitle={`Transfira de uma conta para o cartão ${account.name}`}
          defaults={{
            toAccountId: account.id,
            amount: invoice.remaining,
            description: `Pagamento fatura ${account.name}`,
          }}
          onCreate={onPay}
        />
      )}
    </>
  );
}
