"use client";

import { useMemo, useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { format, addMonths, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Gauge,
  PiggyBank,
  Plus,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { BudgetFormDialog, budgetCategoryLabel } from "@/components/budgets/BudgetFormDialog";
import { useBudgets } from "@/hooks/useBudgets";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BudgetSummaryItem, GLOBAL_BUDGET_CATEGORY } from "@/types/api";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

/** Verde até 80%, âmbar até 100%, vermelho acima — padrão dos apps de finanças. */
function usageColor(percent: number) {
  if (percent > 100) return "#ef4444";
  if (percent >= 80) return "#f59e0b";
  return "#10b981";
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: usageColor(percent) }}
      />
    </div>
  );
}

function RemainingLabel({ budget }: { budget: BudgetSummaryItem }) {
  if (budget.remaining < 0) {
    return (
      <span className="text-red-500 font-semibold">
        Excedido em {formatCurrency(-budget.remaining)}
      </span>
    );
  }
  return (
    <span className="text-slate-500">
      Restam <span className="font-semibold text-slate-700">{formatCurrency(budget.remaining)}</span>
    </span>
  );
}

export default function BudgetsPage() {
  // Categorias personalizadas: carrega e re-renderiza a página quando chegam.
  useCategories();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const month = format(selectedMonth, "yyyy-MM");
  const previousMonth = format(addMonths(selectedMonth, -1), "yyyy-MM");

  const { budgets, loading, error, createBudget, updateBudget, deleteBudget, copyBudgets } =
    useBudgets(month);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetSummaryItem | null>(null);
  const [copying, setCopying] = useState(false);

  const globalBudget = budgets.find((b) => b.category === GLOBAL_BUDGET_CATEGORY) ?? null;
  const categoryBudgets = useMemo(
    () =>
      budgets
        .filter((b) => b.category !== GLOBAL_BUDGET_CATEGORY)
        .sort((a, b) => b.percentUsed - a.percentUsed),
    [budgets],
  );

  // Com orçamento global, ele é o teto do mês; sem ele, soma das categorias.
  const planned = globalBudget?.amount ?? categoryBudgets.reduce((s, b) => s + b.amount, 0);
  const spent = globalBudget?.spentAmount ?? categoryBudgets.reduce((s, b) => s + b.spentAmount, 0);
  const available = planned - spent;
  const overCount = budgets.filter((b) => b.remaining < 0).length;

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === selectedMonth.getFullYear() && now.getMonth() === selectedMonth.getMonth();
  const daysLeft = isCurrentMonth ? getDaysInMonth(now) - now.getDate() + 1 : 0;
  const dailyAllowance = isCurrentMonth && available > 0 ? Math.floor(available / daysLeft) : 0;

  const monthLabel = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  async function handleCopy() {
    setCopying(true);
    try {
      const { created, skipped } = await copyBudgets(previousMonth, month);
      if (created === 0) {
        toast.info("Todas as categorias do mês anterior já têm orçamento neste mês");
      } else {
        toast.success(
          `${created} orçamento${created > 1 ? "s" : ""} copiado${created > 1 ? "s" : ""}` +
            (skipped > 0 ? ` (${skipped} já existia${skipped > 1 ? "m" : ""})` : ""),
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao copiar orçamentos");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header
        title="Orçamentos"
        subtitle="Planeje quanto gastar por categoria a cada mês"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={copying}
              className="font-semibold rounded-2xl gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copiar mês anterior</span>
            </Button>
            <Button
              onClick={openCreate}
              className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo orçamento
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setSelectedMonth((m) => addMonths(m, -1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-base font-bold text-slate-900 capitalize min-w-[180px] text-center">
            {monthLabel}
          </p>
          <button
            onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            variant="dark"
            label="Orçado no mês"
            value={planned}
            format={formatCurrency}
            icon={Wallet}
            iconClassName="bg-slate-800 text-emerald-400"
            loading={loading}
            footer={globalBudget ? "Limite total do mês" : `${categoryBudgets.length} categorias`}
          />
          <StatCard
            label="Gasto"
            value={spent}
            format={formatCurrency}
            icon={TrendingDown}
            iconClassName="bg-red-50 text-red-500"
            loading={loading}
            footer={planned > 0 ? `${Math.round((spent / planned) * 100)}% do orçado` : "—"}
          />
          <StatCard
            label={available >= 0 ? "Disponível" : "Acima do orçado"}
            value={Math.abs(available)}
            format={formatCurrency}
            icon={PiggyBank}
            iconClassName="bg-emerald-50 text-emerald-500"
            valueClassName={available < 0 ? "text-red-500" : undefined}
            loading={loading}
            footer={
              dailyAllowance > 0
                ? `≈ ${formatCurrency(dailyAllowance)}/dia até o fim do mês`
                : overCount > 0
                  ? `${overCount} orçamento${overCount > 1 ? "s" : ""} estourado${overCount > 1 ? "s" : ""}`
                  : "—"
            }
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Pulse key={i} className="h-20" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">{error}</div>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Gauge className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-700 mb-1">Nenhum orçamento em {monthLabel}</p>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Defina limites por categoria (ou um limite total) e acompanhe quanto ainda pode gastar no mês.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={copying}
                className="font-semibold rounded-2xl gap-2 border-slate-200"
              >
                <Copy className="w-4 h-4" />
                Copiar do mês anterior
              </Button>
              <Button
                onClick={openCreate}
                className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar orçamento
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {globalBudget && (
              <button
                onClick={() => {
                  setEditing(globalBudget);
                  setDialogOpen(true);
                }}
                className="w-full text-left bg-white rounded-3xl shadow-sm p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Limite total do mês
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {formatCurrency(globalBudget.spentAmount)}{" "}
                      <span className="text-sm font-medium text-slate-400">
                        de {formatCurrency(globalBudget.amount)}
                      </span>
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: usageColor(globalBudget.percentUsed) }}
                  >
                    {globalBudget.percentUsed}%
                  </span>
                </div>
                <ProgressBar percent={globalBudget.percentUsed} />
                <p className="text-xs">
                  <RemainingLabel budget={globalBudget} />
                </p>
              </button>
            )}

            {categoryBudgets.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50">
                  <h2 className="text-base font-bold text-slate-900">Por categoria</h2>
                </div>
                <ul className="divide-y divide-slate-50">
                  {categoryBudgets.map((b) => {
                    const style = getCategoryStyle(b.category);
                    const Icon = style.icon;
                    return (
                      <li key={b.id}>
                        <button
                          onClick={() => {
                            setEditing(b);
                            setDialogOpen(true);
                          }}
                          className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: style.color + "20" }}
                          >
                            <Icon className="w-4 h-4" style={{ color: style.color }} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                {budgetCategoryLabel(b.category)}
                                {b.remaining < 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                              </p>
                              <p className="text-xs tabular-nums text-slate-500 whitespace-nowrap">
                                <span className="font-semibold text-slate-800">
                                  {formatCurrency(b.spentAmount)}
                                </span>{" "}
                                de {formatCurrency(b.amount)}
                              </p>
                            </div>
                            <ProgressBar percent={b.percentUsed} />
                            <div className="flex items-center justify-between text-[11px]">
                              <RemainingLabel budget={b} />
                              <span
                                className={cn("font-bold tabular-nums")}
                                style={{ color: usageColor(b.percentUsed) }}
                              >
                                {b.percentUsed}%
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        budget={editing}
        usedCategories={budgets.map((b) => b.category)}
        onCreate={(category, amount) => createBudget({ category, amount, month })}
        onUpdate={updateBudget}
        onDelete={deleteBudget}
      />
    </div>
  );
}
