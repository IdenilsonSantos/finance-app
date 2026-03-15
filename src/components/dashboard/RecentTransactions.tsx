"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  FileText,
  Calendar,
  History as HistoryIcon,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  User,
  Search,
  ListFilter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardTransaction, DashboardScheduledTransaction } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { getCategoryStyle, CATEGORY_STYLES } from "@/lib/categories";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const FREQUENCY_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

function initials(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  scheduled: DashboardScheduledTransaction[];
}

export function RecentTransactions({ transactions, scheduled }: RecentTransactionsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("recent");

  // Scheduled filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");

  const hasActiveFilters = typeFilter !== "all" || categoryFilter !== "all" || frequencyFilter !== "all";

  function clearFilters() {
    setTypeFilter("all");
    setCategoryFilter("all");
    setFrequencyFilter("all");
    setSearch("");
  }

  const filteredScheduled = useMemo(() => {
    return scheduled.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (frequencyFilter !== "all" && s.frequency !== frequencyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const catLabel = getCategoryStyle(s.category).label.toLowerCase();
        return (
          (s.description ?? "").toLowerCase().includes(q) ||
          catLabel.includes(q) ||
          (s.bankAccountName ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [scheduled, typeFilter, categoryFilter, frequencyFilter, search]);

  const isRecentEmpty = transactions.length === 0;
  const isScheduledEmpty = filteredScheduled.length === 0;

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50">
        <FilterTabs
          tabs={TABS}
          value={activeTab}
          onChange={(v) => {
            setActiveTab(v as TabId);
            clearFilters();
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

      {/* Scheduled toolbar: type tabs + search + filter popover */}
      {activeTab === "scheduled" && (
        <div className="px-6 py-3 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <FilterTabs
            tabs={TYPE_TABS}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TypeFilter)}
          />
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar agendamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm rounded-2xl border border-slate-200"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-2xl border transition-colors shrink-0",
                    hasActiveFilters
                      ? "bg-[#1E1E2D] text-white border-[#1E1E2D]"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <ListFilter className="w-4 h-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Categoria</p>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(CATEGORY_STYLES)
                        .filter(([key]) => key !== "outros")
                        .map(([key, style]) => (
                          <SelectItem key={key} value={key}>{style.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Frequência</p>
                  <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                    <SelectTrigger className="h-10 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={() => { setCategoryFilter("all"); setFrequencyFilter("all"); setTypeFilter("all"); }}
                    className="w-full text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-2 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Table */}
      {activeTab === "recent" ? (
        isRecentEmpty ? (
          <EmptyState icon={FileText} message="Nenhuma transação encontrada" subtitle="Registre seus ganhos e gastos para visualizar aqui" />
        ) : (
          <TableWrapper>
            <colgroup>
              <col />
              <col className="hidden sm:table-column" style={{ width: 160 }} />
              <col className="hidden md:table-column" style={{ width: 160 }} />
              <col style={{ width: 130 }} />
              <col className="hidden lg:table-column" style={{ width: 110 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Descrição</Th>
                <Th className="hidden sm:table-cell">Categoria</Th>
                <Th className="hidden md:table-cell">Conta</Th>
                <Th className="text-right pr-6">Valor</Th>
                <Th className="hidden lg:table-cell">Data</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const style = getCategoryStyle(tx.category);
                return (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="pl-6 pr-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0">
                          {tx.description ? (
                            <span className="text-[11px] font-bold text-slate-600 uppercase leading-none">
                              {initials(tx.description)}
                            </span>
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <p className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {tx.description || <span className="text-slate-300 font-normal italic">—</span>}
                        </p>
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
                      {tx.bankAccountName ? (
                        <span className="text-xs text-slate-500 font-medium truncate block max-w-[140px]">
                          {tx.bankAccountName}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 pr-6 py-4 align-middle text-right">
                      <span className={cn("font-bold tabular-nums text-sm whitespace-nowrap", tx.type === "income" ? "text-emerald-600" : "text-red-600")}>
                        {tx.type === "income" ? "+ " : "- "}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="pl-4 pr-6 py-4 align-middle hidden lg:table-cell">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {format(new Date(tx.date + "T12:00:00"), "dd 'de' MMM.", { locale: ptBR })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrapper>
        )
      ) : (
        isScheduledEmpty ? (
          <EmptyState
            icon={Calendar}
            message={hasActiveFilters || search ? "Nenhum agendamento encontrado" : "Nenhum agendamento próximo"}
            subtitle={hasActiveFilters || search ? "Tente ajustar os filtros ou a busca" : "Agende suas contas futuras para não perder o controle"}
          />
        ) : (
          <TableWrapper>
            <colgroup>
              <col />
              <col className="hidden sm:table-column" style={{ width: 160 }} />
              <col className="hidden md:table-column" style={{ width: 160 }} />
              <col style={{ width: 130 }} />
              <col className="hidden lg:table-column" style={{ width: 110 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Descrição</Th>
                <Th className="hidden sm:table-cell">Categoria</Th>
                <Th className="hidden md:table-cell">Frequência</Th>
                <Th className="text-right pr-6">Valor</Th>
                <Th className="hidden lg:table-cell">Próxima Data</Th>
              </tr>
            </thead>
            <tbody>
              {filteredScheduled.map((s) => {
                const style = getCategoryStyle(s.category);
                return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="pl-6 pr-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center shrink-0">
                          {s.description ? (
                            <span className="text-[11px] font-bold text-slate-600 uppercase leading-none">
                              {initials(s.description)}
                            </span>
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <p className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {s.description || <span className="text-slate-300 font-normal italic">—</span>}
                        </p>
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
                      <span className="text-xs text-slate-500 font-medium">
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
          </TableWrapper>
        )
      )}
    </Card>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
      <table className="w-full text-sm border-collapse table-fixed">
        {children}
      </table>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("h-11 pl-6 pr-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-white z-10", className)}>
      {children}
    </th>
  );
}

function EmptyState({ icon: Icon, message, subtitle }: { icon: React.ElementType; message: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
