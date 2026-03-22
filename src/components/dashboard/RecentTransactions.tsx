"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  FileText,
  Calendar,
  History as HistoryIcon,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  RepeatIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardTransaction, DashboardScheduledTransaction } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { getCategoryStyle } from "@/lib/categories";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const TABS = [
  { id: "recent", label: "Transações Recentes", icon: HistoryIcon },
  { id: "scheduled", label: "Agendamentos", icon: Calendar },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TYPE_TABS = [
  { id: "all", label: "Tudo", icon: LayoutGrid },
  { id: "income", label: "Receitas", icon: TrendingUp },
  { id: "expense", label: "Despesas", icon: TrendingDown },
] as const;

type TypeFilter = (typeof TYPE_TABS)[number]["id"];

const FREQUENCY_LABELS: Record<string, string> = {
  once: "Uma vez",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

const CARD_HEIGHT = 420;

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  scheduled: DashboardScheduledTransaction[];
}

export function RecentTransactions({ transactions, scheduled }: RecentTransactionsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("recent");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filteredScheduled = useMemo(() => {
    if (typeFilter === "all") return scheduled;
    return scheduled.filter((s) => s.type === typeFilter);
  }, [scheduled, typeFilter]);

  // Map DashboardTransaction → TransactionItem (same shape TransactionsTable expects)
  const transactionItems = useMemo(() =>
    transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      beneficiary: tx.beneficiary,
      paymentMethod: tx.paymentMethod,
      date: tx.date,
      bankAccountName: tx.bankAccountName,
      bankAccountColor: tx.bankAccountColor,
    })),
  [transactions]);

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
        <FilterTabs
          tabs={TABS}
          value={activeTab}
          onChange={(v) => {
            setActiveTab(v as TabId);
            setTypeFilter("all");
          }}
        />
        <button
          onClick={() =>
            router.push(activeTab === "recent" ? "/transactions" : "/transactions?tab=scheduled")
          }
          className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          <span>Ver Tudo</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Fixed-height body */}
      <div className="h-[420px] flex flex-col">
        {activeTab === "scheduled" && (
          <div className="px-6 py-3 border-b border-slate-50 shrink-0">
            <FilterTabs
              tabs={TYPE_TABS}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as TypeFilter)}
            />
          </div>
        )}

        {activeTab === "recent" ? (
          <TransactionsTable
            transactions={transactionItems}
            simple
            tableHeight={CARD_HEIGHT}
            emptyIcon={FileText}
            emptyMessage="Nenhuma transação encontrada"
            emptySubtitle="Registre seus ganhos e gastos para visualizar aqui"
          />
        ) : filteredScheduled.length === 0 ? (
          <EmptyState
            icon={Calendar}
            message="Nenhum agendamento encontrado"
            subtitle="Crie transações com data futura para agendar"
          />
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <table className="w-full text-sm border-collapse table-fixed">
              <colgroup>
                <col />
                <col className="hidden sm:table-column" style={{ width: 150 }} />
                <col className="hidden md:table-column" style={{ width: 130 }} />
                <col style={{ width: 130 }} />
                <col className="hidden lg:table-column" style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="h-11 pl-6 pr-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-white z-10">
                    Descrição
                  </th>
                  <th className="h-11 px-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell sticky top-0 bg-white z-10">
                    Categoria
                  </th>
                  <th className="h-11 px-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell sticky top-0 bg-white z-10">
                    Frequência
                  </th>
                  <th className="h-11 px-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap pr-6 sticky top-0 bg-white z-10">
                    Valor
                  </th>
                  <th className="h-11 pl-4 pr-6 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell sticky top-0 bg-white z-10">
                    Próxima Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredScheduled.map((s) => {
                  const style = getCategoryStyle(s.category);
                  const Icon = style.icon;
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="pl-6 pr-4 py-4 align-middle">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: style.color + "20" }}
                          >
                            <Icon className="w-4 h-4" style={{ color: style.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]">
                              {s.description || style.label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle hidden sm:table-cell">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                          style={{ backgroundColor: style.color + "22", color: style.color }}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <RepeatIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          {FREQUENCY_LABELS[s.frequency] ?? s.frequency}
                        </span>
                      </td>
                      <td className="px-4 pr-6 py-4 align-middle text-right">
                        <span className={cn("font-bold tabular-nums text-sm whitespace-nowrap", s.type === "income" ? "text-emerald-600" : "text-red-600")}>
                          {s.type === "income" ? "+ " : "- "}{formatCurrency(s.amount)}
                        </span>
                      </td>
                      <td className="pl-4 pr-6 py-4 align-middle hidden lg:table-cell">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {format(new Date(s.nextDate + "T12:00:00"), "dd 'de' MMM.", { locale: ptBR })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}

function EmptyState({ icon: Icon, message, subtitle }: { icon: React.ElementType; message: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
