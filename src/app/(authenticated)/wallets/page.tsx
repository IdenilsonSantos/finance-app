"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  ListFilter,
  LayoutGrid,
  Landmark,
  PiggyBank,
  Building2,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { WalletFormDialog } from "@/components/wallets/WalletFormDialog";
import { TransferFormDialog } from "@/components/wallets/TransferFormDialog";
import { WalletsTable } from "@/components/wallets/WalletsTable";
import { useWallets } from "@/hooks/useWallets";
import { BankAccountResponse } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

function WalletsSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
        <Pulse className="h-5 w-28" />
        <Pulse className="h-9 w-48 rounded-2xl" />
      </div>
      <div className="flex gap-1 px-6 py-3 border-b border-slate-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-8 w-20 rounded-xl" />
        ))}
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Pulse className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-3.5 w-36" />
              <Pulse className="h-2.5 w-20" />
            </div>
            <Pulse className="h-6 w-20 rounded-full hidden sm:block" />
            <Pulse className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TYPE_TABS = [
  { id: "all", label: "Todas", icon: LayoutGrid },
  { id: "checking", label: "C. Corrente", icon: Landmark },
  { id: "savings", label: "Poupança", icon: PiggyBank },
  { id: "investment", label: "Investimento", icon: Building2 },
  { id: "cash", label: "Dinheiro", icon: CreditCard },
] as const;

type TypeFilter = (typeof TYPE_TABS)[number]["id"];
type SortOrder = "name_asc" | "name_desc" | "balance_highest" | "balance_lowest";

export default function WalletsPage() {
  const { wallets, loading, error, createWallet, updateWallet, deleteWallet, createTransfer } = useWallets();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc");
  const hasActiveFilters = sortOrder !== "name_asc";

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const positiveCount = wallets.filter((w) => w.balance >= 0).length;
  const negativeCount = wallets.filter((w) => w.balance < 0).length;

  const filtered = useMemo(() => {
    let list = wallets.filter((w) => {
      if (typeFilter !== "all" && w.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q);
      }
      return true;
    });

    if (sortOrder === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === "name_desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOrder === "balance_highest") list = [...list].sort((a, b) => b.balance - a.balance);
    else if (sortOrder === "balance_lowest") list = [...list].sort((a, b) => a.balance - b.balance);

    return list;
  }, [wallets, typeFilter, search, sortOrder]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(wallet: BankAccountResponse) {
    setEditing(wallet);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteWallet(id);
      toast.success("Conta excluída");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir conta");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header
        title="Carteiras"
        subtitle="Gerencie suas contas e saldos"
        actions={
          <div className="flex items-center gap-2">
            {wallets.length >= 2 && (
              <Button
                onClick={() => setTransferOpen(true)}
                variant="outline"
                className="font-semibold rounded-2xl gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Transferir
              </Button>
            )}
            <Button
              onClick={openCreate}
              className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova conta
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-4 md:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            variant="dark"
            label="Saldo Total"
            value={totalBalance}
            format={formatCurrency}
            icon={Wallet}
            iconClassName="bg-slate-800 text-emerald-400"
            valueClassName={totalBalance < 0 ? "text-red-400" : "text-white"}
            loading={loading}
            footer={
              wallets.length > 0
                ? `${wallets.length} conta${wallets.length > 1 ? "s" : ""} ativa${wallets.length > 1 ? "s" : ""}`
                : "Nenhuma conta cadastrada"
            }
          />
          <StatCard
            label="Contas Positivas"
            value={positiveCount}
            icon={TrendingUp}
            iconClassName="bg-emerald-50 text-emerald-500"
            loading={loading}
            footer={
              negativeCount > 0
                ? `${negativeCount} conta${negativeCount > 1 ? "s" : ""} negativa${negativeCount > 1 ? "s" : ""}`
                : "Todas no positivo"
            }
          />
          <StatCard
            label="Maior Saldo"
            value={wallets.length > 0 ? Math.max(...wallets.map((w) => w.balance)) : 0}
            format={formatCurrency}
            icon={TrendingDown}
            iconClassName="bg-red-50 text-red-500"
            loading={loading}
            footer={
              wallets.length > 0
                ? wallets.reduce((best, w) => (w.balance > best.balance ? w : best), wallets[0]).name
                : "—"
            }
          />
        </div>

        {/* Table */}
        {loading ? (
          <WalletsSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            {error}
          </div>
        ) : wallets.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-700 mb-1">
              Nenhuma conta cadastrada
            </p>
            <p className="text-sm text-slate-400 max-w-xs mb-6">
              Adicione suas contas bancárias, carteiras e investimentos para organizar suas finanças
            </p>
            <Button
              onClick={openCreate}
              className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeira conta
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {/* Table header bar */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
              <h2 className="text-base font-bold text-slate-900">Contas</h2>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-2xl border border-slate-200"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "relative flex items-center justify-center w-9 h-9 rounded-2xl border transition-colors",
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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Ordem
                      </p>
                      <Select
                        value={sortOrder}
                        onValueChange={(v) => setSortOrder(v as SortOrder)}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                          <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                          <SelectItem value="balance_highest">Maior Saldo</SelectItem>
                          <SelectItem value="balance_lowest">Menor Saldo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <button
                      onClick={() => setSortOrder("name_asc")}
                      className="w-full text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-2 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Search mobile */}
            <div className="sm:hidden px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-2xl border border-slate-200 w-full"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-b border-slate-50">
              <FilterTabs
                tabs={TYPE_TABS}
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as TypeFilter)}
              />
            </div>

            <WalletsTable
              wallets={filtered}
              deletingId={deletingId}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      <WalletFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        wallet={editing}
        onCreate={createWallet}
        onUpdate={updateWallet}
        onDelete={deleteWallet}
      />

      <TransferFormDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        accounts={wallets}
        onCreate={createTransfer}
      />
    </div>
  );
}
