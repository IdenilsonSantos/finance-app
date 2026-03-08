"use client";

import { useState, useMemo } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
  CalendarDays,
  LayoutGrid,
  ListFilter,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthDateStrip } from "@/components/ui/MonthDateStrip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_STYLES } from "@/lib/categories";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { TransactionResponse } from "@/types/api";
import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="flex items-center gap-3 px-6 py-4 border-b border-slate-50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Pulse className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <Pulse className="h-3.5 w-32" />
          <Pulse className="h-2.5 w-20" />
        </div>
        <Pulse className="h-6 w-20 rounded-full hidden md:block" />
        <Pulse className="h-6 w-16 rounded-full hidden md:block" />
        <Pulse className="h-4 w-16 ml-auto" />
        <Pulse className="h-3.5 w-14 hidden lg:block" />
      </div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
        <Pulse className="h-5 w-28" />
        <Pulse className="h-9 w-56 rounded-2xl" />
      </div>

      <div className="px-6 py-4 border-b border-slate-50 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Pulse className="h-7 w-7 rounded-lg" />
          <Pulse className="h-5 w-32" />
          <Pulse className="h-7 w-7 rounded-lg" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Pulse key={i} className="w-12 h-14 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>

      <div className="flex gap-1 px-6 py-3 border-b border-slate-50">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-20 rounded-xl" />
        ))}
      </div>
      
      <div>
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonRow key={i} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

const TYPE_TABS = [
  { id: "all", label: "Tudo", icon: LayoutGrid },
  { id: "income", label: "Receitas", icon: TrendingUp },
  { id: "expense", label: "Despesas", icon: TrendingDown },
  { id: "transfer", label: "Transferências", icon: ArrowLeftRight },
  { id: "scheduled", label: "Agendamentos", icon: CalendarDays },
] as const;

type TypeFilter = (typeof TYPE_TABS)[number]["id"];

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

export default function TransactionsPage() {
  const {
    transactions,
    bankAccounts,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const hasActiveFilters = categoryFilter !== "all" || accountFilter !== "all" || sortOrder !== "newest";

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthIndex = month === 0 ? 11 : month - 1;

  const currentMonthTxs = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = new Date(tx.date + "T12:00:00");
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [transactions, year, month],
  );

  const prevMonthTxs = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = new Date(tx.date + "T12:00:00");
        return d.getFullYear() === prevMonthYear && d.getMonth() === prevMonthIndex;
      }),
    [transactions, prevMonthYear, prevMonthIndex],
  );

  const totalBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const monthIncome = currentMonthTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = currentMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevMonthTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const animatedBalance = useCountUp(totalBalance, { duration: 900, enabled: !loading });
  const animatedIncome = useCountUp(monthIncome, { duration: 750, enabled: !loading });
  const animatedExpense = useCountUp(monthExpense, { duration: 750, enabled: !loading });

  const incomePct = pct(monthIncome, prevIncome);
  const expensePct = pct(monthExpense, prevExpense);

  const filtered = useMemo(() => {
    let list = currentMonthTxs.filter((tx) => {
      if (selectedDay !== null) {
        const d = new Date(tx.date + "T12:00:00");
        if (d.getDate() !== selectedDay) return false;
      }
      if (typeFilter === "transfer" || typeFilter === "scheduled") return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
      if (accountFilter !== "all" && tx.bankAccountId !== accountFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const catLabel = getCategoryStyle(tx.category).label.toLowerCase();
        const account = bankAccounts.find((a) => a.id === tx.bankAccountId);
        return (
          catLabel.includes(q) ||
          (tx.description ?? "").toLowerCase().includes(q) ||
          (tx.beneficiary ?? "").toLowerCase().includes(q) ||
          (account?.name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortOrder === "newest") list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    else if (sortOrder === "oldest") list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    else if (sortOrder === "highest") list = [...list].sort((a, b) => b.amount - a.amount);
    else if (sortOrder === "lowest") list = [...list].sort((a, b) => a.amount - b.amount);

    return list;
  }, [currentMonthTxs, selectedDay, typeFilter, categoryFilter, accountFilter, sortOrder, search, bankAccounts]);

  function prevMonth() {
    setSelectedMonth(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setSelectedMonth(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }
  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(tx: TransactionResponse) {
    setEditing(tx);
    setDialogOpen(true);
  }
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      toast.success("Transação excluída");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir transação");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header
        title="Transações"
        subtitle="Gerencie suas receitas e despesas"
        actions={
          <Button
            onClick={openCreate}
            className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova transação
          </Button>
        }
      />

      <div className="flex-1 p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1E1E2D] rounded-3xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                  Saldo Total
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    totalBalance < 0 ? "text-red-400" : "text-white",
                  )}
                >
                  {formatCurrency(animatedBalance)}
                </p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">
                {bankAccounts.length > 0 ? `${bankAccounts.length} conta${bankAccounts.length > 1 ? "s" : ""}` : "—"}
              </span>
              <span className="text-slate-500">ativas</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                  Receitas (Mês)
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(animatedIncome)}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              {incomePct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={cn("font-semibold", incomePct >= 0 ? "text-emerald-400" : "text-red-400")}>
                {incomePct >= 0 ? "+" : ""}{incomePct.toFixed(1)}%
              </span>
              <span className="text-slate-400">vs mês anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                  Despesas (Mês)
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(animatedExpense)}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-xl">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              {expensePct <= 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={cn("font-semibold", expensePct <= 0 ? "text-emerald-400" : "text-red-400")}>
                {expensePct >= 0 ? "+" : ""}{expensePct.toFixed(1)}%
              </span>
              <span className="text-slate-400">vs mês anterior</span>
            </div>
          </div>
        </div>

        {loading ? (
          <TransactionSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
              <h2 className="text-base font-bold text-slate-900">Movimentações</h2>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Buscar por título ou beneficiário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-2xl border border-slate-200"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "relative flex items-center justify-center w-9 h-9 rounded-2xl border transition-colors",
                      hasActiveFilters
                        ? "bg-[#1E1E2D] text-white border-[#1E1E2D]"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                    )}>
                      <ListFilter className="w-4 h-4" />
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-4 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo</p>
                      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="income">Receitas</SelectItem>
                          <SelectItem value="expense">Despesas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conta / Carteira</p>
                      <Select value={accountFilter} onValueChange={setAccountFilter}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Contas</SelectItem>
                          {bankAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ordem</p>
                      <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mais Recentes</SelectItem>
                          <SelectItem value="oldest">Mais Antigas</SelectItem>
                          <SelectItem value="highest">Maior Valor</SelectItem>
                          <SelectItem value="lowest">Menor Valor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <button
                      onClick={() => { setCategoryFilter("all"); setAccountFilter("all"); setSortOrder("newest"); setTypeFilter("all"); }}
                      className="w-full text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-2 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="sm:hidden px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Buscar por título ou beneficiário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-2xl border border-slate-200 w-full"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-b border-slate-50">
              <MonthDateStrip
                selectedMonth={selectedMonth}
                selectedDay={selectedDay}
                activeDates={currentMonthTxs.map((tx) => tx.date)}
                onMonthChange={setSelectedMonth}
                onDayChange={setSelectedDay}
              />
            </div>

            <div className="px-6 py-3 border-b border-slate-50">
              <div className="flex gap-1 flex-wrap">
                {TYPE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTypeFilter(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all cursor-pointer",
                        typeFilter === tab.id
                          ? "bg-[#1E1E2D] text-white"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <TransactionsTable
              transactions={filtered}
              bankAccounts={bankAccounts}
              deletingId={deletingId}
              onEdit={openEdit}
              onDelete={handleDelete}
              emptyIcon={TYPE_TABS.find((t) => t.id === typeFilter)?.icon}
              emptyMessage={
                typeFilter === "income" ? "Nenhuma receita encontrada" :
                typeFilter === "expense" ? "Nenhuma despesa encontrada" :
                typeFilter === "transfer" ? "Nenhuma transferência encontrada" :
                typeFilter === "scheduled" ? "Nenhum agendamento encontrado" :
                "Nenhuma transação encontrada"
              }
              emptySubtitle={
                typeFilter === "income" ? "Tente ajustar os filtros ou crie uma nova receita" :
                typeFilter === "expense" ? "Tente ajustar os filtros ou crie uma nova despesa" :
                typeFilter === "transfer" ? "Tente ajustar os filtros ou registre uma transferência" :
                typeFilter === "scheduled" ? "Tente ajustar os filtros ou agende uma transação" :
                "Tente ajustar os filtros ou crie uma nova transação"
              }
            />
          </div>
        )}
      </div>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editing}
        bankAccounts={bankAccounts}
        onCreate={createTransaction}
        onUpdate={updateTransaction}
        onDelete={editing ? deleteTransaction : undefined}
      />
    </div>
  );
}
