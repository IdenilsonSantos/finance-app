"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, PiggyBank, Landmark, CreditCard, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardAccount } from "@/types/api";
import { formatCurrency } from "@/lib/format";

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
}

export function AccountsOverview({ accounts }: AccountsOverviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAccountId = searchParams.get("accountId");

  const handleAccountClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("accountId") === id) {
      params.delete("accountId");
    } else {
      params.set("accountId", id);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl h-[445px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-slate-900">
            Suas Contas
          </CardTitle>
          <p className="text-sm text-slate-500">Saldo por instituição</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-6 pb-6 pt-2 flex flex-col overflow-hidden">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              Nenhuma conta encontrada
            </p>
            <p className="text-xs text-slate-400 max-w-[180px]">
              Adicione suas contas para começar a organizar sua vida financeira
            </p>
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
                      "flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100",
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
                    <p
                      className={cn(
                        "font-bold text-sm",
                        account.balance >= 0 ? "text-slate-900" : "text-red-600",
                      )}
                    >
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
