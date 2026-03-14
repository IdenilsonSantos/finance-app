"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, PiggyBank, Landmark, CreditCard, LucideIcon, Pencil, Plus, ArrowRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardAccount, BankAccountResponse } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { WalletFormDialog } from "@/components/wallets/WalletFormDialog";
import { TransferFormDialog } from "@/components/wallets/TransferFormDialog";
import { api } from "@/lib/api/client";
import { CreateWalletPayload, UpdateWalletPayload, CreateTransferPayload } from "@/hooks/useWallets";

const TYPE_ICONS: Record<string, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  investment: Building2,
  cash: CreditCard,
};

const TYPE_LABELS: Record<string, string> = {
  checking: "C. Corrente",
  savings: "Poupança",
  investment: "Investimento",
  cash: "Dinheiro",
};

interface AccountsOverviewProps {
  accounts: DashboardAccount[];
  onMutate?: () => void;
}

export function AccountsOverview({ accounts, onMutate }: AccountsOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAccountId = searchParams.get("accountId");

  const [editDialog, setEditDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [editing, setEditing] = useState<BankAccountResponse | null>(null);

  const asBankAccounts: BankAccountResponse[] = accounts.map((a) => ({
    id: a.id,
    workspaceId: "",
    name: a.name,
    type: a.type,
    color: a.color,
    balance: a.balance,
    createdAt: "",
    updatedAt: "",
  }));

  const handleAccountClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("accountId") === id) {
      params.delete("accountId");
    } else {
      params.set("accountId", id);
    }
    router.push(`?${params.toString()}`);
  };

  function openEdit(e: React.MouseEvent, account: DashboardAccount) {
    e.stopPropagation();
    setEditing(asBankAccounts.find((a) => a.id === account.id) ?? null);
    setEditDialog(true);
  }

  async function handleCreate(data: CreateWalletPayload) {
    await api.post("/bank-accounts", data);
    onMutate?.();
  }

  async function handleUpdate(id: string, data: UpdateWalletPayload) {
    await api.patch(`/bank-accounts/${id}`, data);
    onMutate?.();
  }

  async function handleDelete(id: string) {
    await api.delete(`/bank-accounts/${id}`);
    onMutate?.();
  }

  async function handleTransfer(data: CreateTransferPayload) {
    await api.post("/transfers", data);
    onMutate?.();
  }

  return (
    <>
      <Card className="shadow-sm border-none bg-white rounded-3xl h-[445px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-900">
              Suas Contas
            </CardTitle>
            <p className="text-sm text-slate-500">Saldo por instituição</p>
          </div>
          {accounts.length > 0 && (
            <div className="flex items-center gap-2">
              {accounts.length >= 2 && (
                <button
                  onClick={() => setTransferDialog(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-[#1E1E2D] transition-colors p-1.5 rounded-xl hover:bg-slate-100"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              )}
              <Link
                href="/wallets"
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Ver todas
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 px-6 pb-6 pt-2 flex flex-col overflow-hidden">
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center flex-1">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Nenhuma conta encontrada
              </p>
              <p className="text-xs text-slate-400 max-w-[180px] mb-4">
                Adicione suas contas para começar a organizar sua vida financeira
              </p>
              <Link
                href="/wallets"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E1E2D] text-white text-xs font-semibold rounded-2xl hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar conta
              </Link>
            </div>
          ) : (
            <ScrollArea className="h-[350px] pr-4 -mr-4">
              <div className="space-y-3 pb-2">
                {accounts.map((account) => {
                  const Icon = TYPE_ICONS[account.type] || Landmark;
                  const isSelected = currentAccountId === account.id;
                  return (
                    <div
                      key={account.id}
                      onClick={() => handleAccountClick(account.id)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100",
                        isSelected
                          ? "bg-slate-50 ring-1 ring-slate-100"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: account.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {account.name}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            {TYPE_LABELS[account.type] || account.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "font-bold text-sm",
                            account.balance >= 0 ? "text-slate-900" : "text-red-600",
                          )}
                        >
                          {formatCurrency(account.balance)}
                        </p>
                        <button
                          onClick={(e) => openEdit(e, account)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <WalletFormDialog
        open={editDialog}
        onOpenChange={(open) => {
          setEditDialog(open);
          if (!open) setEditing(null);
        }}
        wallet={editing}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <TransferFormDialog
        open={transferDialog}
        onOpenChange={setTransferDialog}
        accounts={asBankAccounts}
        onCreate={handleTransfer}
      />
    </>
  );
}
