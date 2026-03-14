"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  FileText,
  Calendar,
  History as HistoryIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardTransaction, DashboardScheduledTransaction } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { getCategoryStyle } from "@/lib/categories";

const TABS = [
  { id: "recent", label: "Transações Recentes", icon: HistoryIcon },
  { id: "scheduled", label: "Agendamentos", icon: Calendar },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  scheduled: DashboardScheduledTransaction[];
}

export function RecentTransactions({ transactions, scheduled }: RecentTransactionsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("recent");

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl overflow-hidden">
      <div className="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50">
        <FilterTabs
          tabs={TABS}
          value={activeTab}
          onChange={(v) => setActiveTab(v as TabId)}
        />
        <button
          onClick={() => router.push(activeTab === "recent" ? "/transactions" : "/transactions?tab=scheduled")}
          className="text-emerald-500 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          <span>Ver Tudo</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <CardContent className="px-4 md:px-6 pb-6 pt-6">
        <ScrollArea className="h-[400px]">
          {activeTab === "recent" ? (
            transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">Nenhuma transação encontrada</p>
                <p className="text-xs text-slate-400 mt-1">Registre seus ganhos e gastos para visualizar aqui</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((tx) => {
                  const style = getCategoryStyle(tx.category);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: style.color }}
                      >
                        <style.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {style.label}
                          {tx.bankAccountName && ` • ${tx.bankAccountName}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            tx.type === "income" ? "text-emerald-600" : "text-red-600",
                          )}
                        >
                          {tx.type === "expense" ? "- " : "+ "}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            scheduled.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">Nenhum agendamento próximo</p>
                <p className="text-xs text-slate-400 mt-1">Agende suas contas futuras para não perder o controle</p>
              </div>
            ) : (
              <div className="space-y-1">
                {scheduled.map((s) => {
                  const style = getCategoryStyle(s.category);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: style.color }}
                      >
                        <style.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {s.description}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {style.label} • {s.frequency}
                          {s.bankAccountName && ` • ${s.bankAccountName}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            s.type === "income" ? "text-emerald-600" : "text-red-600",
                          )}
                        >
                          {s.type === "expense" ? "- " : "+ "}
                          {formatCurrency(s.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(s.nextDate).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
