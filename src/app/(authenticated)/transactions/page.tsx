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
  Upload,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthDateStrip } from "@/components/ui/MonthDateStrip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_STYLES } from "@/lib/categories";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { ScheduledTransactionFormDialog } from "@/components/transactions/ScheduledTransactionFormDialog";
import { ScheduledTransactionsView } from "@/components/transactions/ScheduledTransactionsView";
import { ImportStatementDialog } from "@/components/transactions/ImportStatementDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useScheduledTransactions } from "@/hooks/useScheduledTransactions";
import { formatCurrency } from "@/lib/format";
import { TransactionResponse, ScheduledTransactionResponse } from "@/types/api";
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

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [scheduledDialogOpen, setScheduledDialogOpen] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledTransactionResponse | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  // Full month range — always used for the income/expense cards, regardless
  // of a specific day being selected below.
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;

  // Build date range for selected month (or specific day)
  const startDate = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : monthStart;
  const endDate = selectedDay ? startDate : monthEnd;

  const {
    transactions,
    total,
    totalPages,
    statsTransactions,
    monthIncome,
    monthExpense,
    bankAccounts,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  } = useTransactions({
    startDate,
    endDate,
    statsStartDate: monthStart,
    statsEndDate: monthEnd,
    type: typeFilter === "income" || typeFilter === "expense" ? typeFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    accountId: accountFilter !== "all" ? accountFilter : undefined,
    search: search || undefined,
    page,
  });

  const { scheduled, createScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction, executeScheduledTransaction } =
    useScheduledTransactions();

  const hasActiveFilters = categoryFilter !== "all" || accountFilter !== "all" || !!search;

  const totalBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const animatedBalance = useCountUp(totalBalance, { duration: 900, enabled: !loading });
  const animatedIncome = useCountUp(monthIncome, { duration: 750, enabled: !loading });
  const animatedExpense = useCountUp(monthExpense, { duration: 750, enabled: !loading });

  const activeDates = useMemo(
    () => statsTransactions.map((tx) => tx.date),
    [statsTransactions],
  );

  const filteredItems = useMemo(
    () =>
      transactions.map((tx) => {
        const account = bankAccounts.find((a) => a.id === tx.bankAccountId);
        return {
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          description: tx.description,
          beneficiary: tx.beneficiary,
          paymentMethod: tx.paymentMethod,
          date: tx.date,
          bankAccountName: account?.name ?? null,
          bankAccountColor: account?.color ?? null,
        };
      }),
    [transactions, bankAccounts],
  );

  const allSelected = filteredItems.length > 0 && selected.size === filteredItems.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredItems.map((t) => t.id)));
    }
  }

  async function handleBulkDelete() {
    await Promise.all([...selected].map((id) => deleteTransaction(id)));
    toast.success(`${selected.size} transaç${selected.size === 1 ? "ão excluída" : "ões excluídas"}`);
    setSelected(new Set());
    setConfirmBulkDelete(false);
  }

  function resetPage() {
    setPage(1);
    setSelected(new Set());
  }

  function prevMonth() {
    setSelectedMonth(new Date(year, month - 1, 1));
    setSelectedDay(null);
    resetPage();
  }
  function nextMonth() {
    setSelectedMonth(new Date(year, month + 1, 1));
    setSelectedDay(null);
    resetPage();
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
          <div className="flex items-center gap-2">
            {typeFilter !== "scheduled" && (
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="font-semibold rounded-2xl gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Upload className="w-4 h-4" />
                Importar extrato
              </Button>
            )}
            <Button
              onClick={() => {
                if (typeFilter === "scheduled") {
                  setEditingScheduled(null);
                  setScheduledDialogOpen(true);
                } else {
                  setEditing(null);
                  setDialogOpen(true);
                }
              }}
              className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
            >
              <Plus className="w-4 h-4" />
              {typeFilter === "scheduled" ? "Novo agendamento" : "Nova transação"}
            </Button>
          </div>
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
                <p className={cn("text-3xl font-bold", totalBalance < 0 ? "text-red-400" : "text-white")}>
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
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(animatedIncome)}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">{statsTransactions.filter((t) => t.type === "income").length} receitas no mês</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                  Despesas (Mês)
                </p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(animatedExpense)}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-xl">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">{statsTransactions.filter((t) => t.type === "expense").length} despesas no mês</span>
            </div>
          </div>
        </div>

        {loading ? (
          <TransactionSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">{error}</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
              <h2 className="text-base font-bold text-slate-900">Movimentações</h2>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <>
                    <span className="text-xs text-slate-400 font-medium">
                      {selected.size} {selected.size === 1 ? "selecionada" : "selecionadas"}
                    </span>
                    <div className="w-px h-4 bg-slate-200" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmBulkDelete(true)}
                      className="h-8 gap-1.5 rounded-2xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </Button>
                    <div className="w-px h-4 bg-slate-200" />
                  </>
                )}
                <div className="relative hidden sm:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Buscar por título ou beneficiário..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Categoria</p>
                      <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
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
                      <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v); resetPage(); }}>
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

                    <button
                      onClick={() => { setCategoryFilter("all"); setAccountFilter("all"); setSearch(""); resetPage(); }}
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
                  onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                  className="pl-9 h-9 text-sm rounded-2xl border border-slate-200 w-full"
                />
              </div>
            </div>

            {typeFilter !== "scheduled" && (
              <div className="px-6 py-4 border-b border-slate-50">
                <MonthDateStrip
                  selectedMonth={selectedMonth}
                  selectedDay={selectedDay}
                  activeDates={activeDates}
                  onMonthChange={(m) => { setSelectedMonth(m); setSelectedDay(null); resetPage(); }}
                  onDayChange={(d) => { setSelectedDay(d); resetPage(); }}
                />
              </div>
            )}

            <div className="px-6 py-3 border-b border-slate-50">
              <FilterTabs
                tabs={TYPE_TABS}
                value={typeFilter}
                onChange={(v) => {
                  setTypeFilter(v as TypeFilter);
                  if (v === "all") setSelectedDay(null);
                  resetPage();
                }}
              />
            </div>

            {typeFilter === "scheduled" ? (
              <ScheduledTransactionsView
                scheduled={scheduled}
                bankAccounts={bankAccounts}
                onEdit={(item) => { setEditingScheduled(item); setScheduledDialogOpen(true); }}
                onDelete={deleteScheduledTransaction}
                onExecute={executeScheduledTransaction}
              />
            ) : (
              <>
                <TransactionsTable
                  transactions={filteredItems}
                  deletingId={deletingId}
                  onEdit={(id) => { const tx = transactions.find((t) => t.id === id); if (tx) openEdit(tx); }}
                  onDelete={handleDelete}
                  emptyIcon={TYPE_TABS.find((t) => t.id === typeFilter)?.icon}
                  emptyMessage={
                    typeFilter === "income" ? "Nenhuma receita encontrada" :
                    typeFilter === "expense" ? "Nenhuma despesa encontrada" :
                    typeFilter === "transfer" ? "Nenhuma transferência encontrada" :
                    "Nenhuma transação encontrada"
                  }
                  emptySubtitle={
                    typeFilter === "income" ? "Tente ajustar os filtros ou crie uma nova receita" :
                    typeFilter === "expense" ? "Tente ajustar os filtros ou crie uma nova despesa" :
                    typeFilter === "transfer" ? "Tente ajustar os filtros ou registre uma transferência" :
                    "Tente ajustar os filtros ou crie uma nova transação"
                  }
                  selected={selected}
                  onToggle={toggleOne}
                  allSelected={allSelected}
                  someSelected={someSelected}
                  onToggleAll={toggleAll}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={20}
                  onPageChange={(p) => { setPage(p); setSelected(new Set()); }}
                />
              </>
            )}
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
        onCreateScheduled={async (data) => {
          await createScheduledTransaction(data);
          setTypeFilter("scheduled");
        }}
      />

      <ScheduledTransactionFormDialog
        open={scheduledDialogOpen}
        onOpenChange={(o) => { setScheduledDialogOpen(o); if (!o) setEditingScheduled(null); }}
        item={editingScheduled}
        bankAccounts={bankAccounts}
        onCreate={async (data) => {
          await createScheduledTransaction(data);
          setTypeFilter("scheduled");
        }}
        onUpdate={updateScheduledTransaction}
        onDelete={deleteScheduledTransaction}
      />

      <ImportStatementDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        bankAccounts={bankAccounts}
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={(open) => !open && setConfirmBulkDelete(false)}
        title="Excluir transações"
        description={`${selected.size} transaç${selected.size === 1 ? "ão será removida" : "ões serão removidas"} permanentemente. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
