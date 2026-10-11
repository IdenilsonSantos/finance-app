"use client";

import { useMemo, useState } from "react";
import { endOfMonth, format, startOfMonth, startOfYear, subMonths } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Loader2,
  PiggyBank,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/Header";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { StatCard } from "@/components/ui/StatCard";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthlyChart } from "@/components/reports/MonthlyChart";
import { CategoryBreakdown } from "@/components/reports/CategoryBreakdown";
import { CategoryTrendChart } from "@/components/reports/CategoryTrendChart";
import { changeLabel, percent } from "@/components/reports/format";
import { useReport } from "@/hooks/useReport";
import { useWallets } from "@/hooks/useWallets";
import { useCategories } from "@/hooks/useCategories";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReportTotals } from "@/types/api";

const PRESETS = [
  { id: "month", label: "Este mês", icon: CalendarDays },
  { id: "3m", label: "3 meses", icon: CalendarRange },
  { id: "6m", label: "6 meses", icon: CalendarRange },
  { id: "year", label: "Este ano", icon: CalendarRange },
  { id: "custom", label: "Personalizado", icon: CalendarRange },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

const iso = (d: Date) => format(d, "yyyy-MM-dd");

function presetRange(id: Exclude<PresetId, "custom">): { start: string; end: string } {
  const today = new Date();
  switch (id) {
    case "month":
      return { start: iso(startOfMonth(today)), end: iso(endOfMonth(today)) };
    case "3m":
      return { start: iso(startOfMonth(subMonths(today, 2))), end: iso(endOfMonth(today)) };
    case "6m":
      return { start: iso(startOfMonth(subMonths(today, 5))), end: iso(endOfMonth(today)) };
    case "year":
      return { start: iso(startOfYear(today)), end: iso(endOfMonth(today)) };
  }
}

/** Variação entre períodos (fração) ou null quando não há base. */
function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

function Delta({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  if (value === null) return <span className="text-slate-400">sem base no período anterior</span>;
  const up = value > 0;
  const good = value === 0 ? null : goodWhenUp ? up : !up;
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          good === null ? "text-slate-500" : good ? "text-emerald-600" : "text-red-500",
        )}
      >
        {value !== 0 && (up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />)}
        {changeLabel(value)}
      </span>
      <span className="text-slate-400">vs período anterior</span>
    </span>
  );
}

function SummaryCards({ totals, previous, loading }: { totals: ReportTotals; previous: ReportTotals; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Receitas"
        value={totals.income}
        format={formatCurrency}
        icon={TrendingUp}
        iconClassName="bg-emerald-50 text-emerald-500"
        loading={loading}
        footer={<Delta value={change(totals.income, previous.income)} goodWhenUp />}
      />
      <StatCard
        label="Despesas"
        value={totals.expense}
        format={formatCurrency}
        icon={TrendingDown}
        iconClassName="bg-red-50 text-red-500"
        loading={loading}
        footer={<Delta value={change(totals.expense, previous.expense)} goodWhenUp={false} />}
      />
      <StatCard
        variant="dark"
        label="Saldo do período"
        value={totals.balance}
        format={formatCurrency}
        icon={Scale}
        iconClassName="bg-slate-800 text-emerald-400"
        valueClassName={totals.balance < 0 ? "text-red-400" : "text-white"}
        loading={loading}
        footer={`Período anterior: ${formatCurrency(previous.balance)}`}
      />
      <StatCard
        label="Taxa de economia"
        value={totals.savingsRate ?? 0}
        format={(v) => (totals.savingsRate === null ? "—" : percent(v, 1))}
        icon={PiggyBank}
        iconClassName="bg-blue-50 text-blue-500"
        loading={loading}
        footer={
          previous.savingsRate === null
            ? "Quanto da renda sobrou no período"
            : `Período anterior: ${percent(previous.savingsRate, 1)}`
        }
      />
    </div>
  );
}

export default function ReportsPage() {
  useCategories();
  const { wallets } = useWallets();
  const [preset, setPreset] = useState<PresetId>("6m");
  const [custom, setCustom] = useState(() => presetRange("month"));
  const [accountId, setAccountId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const range = preset === "custom" ? custom : presetRange(preset);
  const invalidRange = range.start > range.end;
  const { report, loading, refreshing, error } = useReport(
    range.start,
    range.end,
    accountId === "all" ? undefined : accountId,
  );

  const expenseCategories = useMemo(
    () => report?.categories.filter((c) => c.type === "expense" && c.total > 0) ?? [],
    [report],
  );
  const trendCategory =
    report?.categories.find((c) => c.type === "expense" && c.category === selectedCategory) ?? expenseCategories[0];
  const hasData = !!report && (report.totals.income > 0 || report.totals.expense > 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header title="Relatórios" subtitle="Para onde foi o seu dinheiro e como isso mudou" />

      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm px-6 py-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <FilterTabs tabs={PRESETS} value={preset} onChange={(v) => setPreset(v as PresetId)} />
            <div className="flex items-center gap-2">
              {refreshing && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-10 rounded-xl text-sm w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {preset === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <DatePicker value={custom.start} onChange={(v) => setCustom((c) => ({ ...c, start: v }))} />
              <DatePicker value={custom.end} onChange={(v) => setCustom((c) => ({ ...c, end: v }))} />
              {invalidRange && (
                <p className="text-xs text-red-500 sm:col-span-2">A data final deve ser igual ou posterior à inicial.</p>
              )}
            </div>
          )}
        </div>

        {error ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">{error}</div>
        ) : (
          <>
            <SummaryCards
              totals={report?.totals ?? EMPTY_TOTALS}
              previous={report?.previousTotals ?? EMPTY_TOTALS}
              loading={loading}
            />

            {!loading && !hasData ? (
              <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-700 mb-1">Nenhuma receita ou despesa no período</p>
                <p className="text-sm text-slate-400 max-w-sm">
                  Escolha outro período ou importe um extrato para ver seus relatórios.
                </p>
              </div>
            ) : (
              report && (
                <>
                  <section className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900">Receitas e despesas por mês</h2>
                    <MonthlyChart months={report.months} />
                  </section>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-slate-50">
                        <h2 className="text-base font-bold text-slate-900">Despesas por categoria</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Toque numa categoria para ver a evolução</p>
                      </div>
                      <CategoryBreakdown
                        categories={report.categories}
                        type="expense"
                        selected={trendCategory?.category}
                        onSelect={setSelectedCategory}
                      />
                    </section>

                    <div className="space-y-6">
                      {trendCategory && report.months.length > 1 && (
                        <section className="bg-white rounded-3xl shadow-sm p-6 space-y-3">
                          <h2 className="text-base font-bold text-slate-900">
                            Evolução: {getCategoryStyle(trendCategory.category).label}
                          </h2>
                          <CategoryTrendChart category={trendCategory} />
                        </section>
                      )}
                      <section className="bg-white rounded-3xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50">
                          <h2 className="text-base font-bold text-slate-900">Receitas por categoria</h2>
                        </div>
                        <CategoryBreakdown categories={report.categories} type="income" />
                      </section>
                    </div>
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

const EMPTY_TOTALS: ReportTotals = {
  income: 0,
  expense: 0,
  balance: 0,
  savingsRate: null,
  incomeCount: 0,
  expenseCount: 0,
};
