"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { FinancialInsights } from "@/components/dashboard/FinancialInsights";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { ExpensesByCategoryChart } from "@/components/dashboard/ExpensesByCategoryChart";
import { SavingsOverview } from "@/components/dashboard/SavingsOverview";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { GoalFormDialog } from "@/components/goals/GoalFormDialog";
import { ContributeDialog } from "@/components/goals/ContributeDialog";
import { useDashboard } from "@/hooks/useDashboard";
import { useGoals } from "@/hooks/useGoals";
import { DashboardGoal, GoalResponse } from "@/types/api";
import { Filter, X, RotateCcw } from "lucide-react";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-3xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-100/80 before:to-transparent ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Shimmer className="md:col-span-2 h-40" />
        <Shimmer className="h-40" />
        <Shimmer className="h-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Shimmer className="h-72" />
        <Shimmer className="lg:col-span-2 h-72" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Shimmer className="h-64" />
        <Shimmer className="lg:col-span-2 h-64" />
      </div>

      <Shimmer className="h-56" />

      <Shimmer className="h-80" />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const accountId = searchParams.get("accountId") ?? undefined;

  const { data, loading, refetch } = useDashboard({ accountId });
  const { createGoal, updateGoal, deleteGoal, contributeGoal } = useGoals();

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalResponse | null>(null);
  const [contributingGoal, setContributingGoal] = useState<GoalResponse | null>(null);

  const firstName = session?.user?.name?.split(" ")[0];
  const greeting = `${getGreeting()}${firstName ? `, ${firstName}` : ""}! Aqui está um resumo das suas finanças`;


  function handleEditGoal(goal: DashboardGoal) {
    setEditingGoal(goal as unknown as GoalResponse);
    setGoalDialogOpen(true);
  }

  function handleContributeGoal(goal: DashboardGoal) {
    setContributingGoal(goal as unknown as GoalResponse);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header title="Dashboard" subtitle={greeting} />

      <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
        {accountId && data && (
          <div className="flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-white/50">
            <div className="flex items-center gap-2 mr-2">
              <div className="p-2 bg-slate-900 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Filtros Ativos
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: data.accounts.find((a) => a.id === accountId)?.color || "#10b981" }}
              />
              <span className="text-[11px] font-bold text-slate-700">
                {data.accounts.find((a) => a.id === accountId)?.name || "Conta Selecionada"}
              </span>
              <button
                onClick={() => router.push("/dashboard")}
                className="ml-1 p-0.5 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="ml-auto flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-2xl transition-all text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100"
            >
              <span className="text-[10px] font-black tracking-widest">LIMPAR</span>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : data ? (
          <>
            <FinancialInsights data={data.financialInsights} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-1">
                <AccountsOverview accounts={data.accounts} onMutate={refetch} />
              </div>
              <div className="lg:col-span-2">
                <CashFlowChart data={data.cashFlow} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-1">
                <ExpensesByCategoryChart data={data.expensesByCategory} />
              </div>
              <div className="lg:col-span-2">
                <GoalsCard
                  goals={data.goals}
                  averageSavings={data.averageSavings}
                  currentMonthSavings={data.currentMonthSavings}
                  onEdit={handleEditGoal}
                  onContribute={handleContributeGoal}
                />
              </div>
            </div>

            <SavingsOverview data={data.savingsOverview} />

            <RecentTransactions
              transactions={data.recentTransactions}
              scheduled={data.upcomingScheduled}
            />
          </>
        ) : (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
            Erro ao carregar dados do dashboard.
          </div>
        )}
      </div>

      <GoalFormDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={editingGoal}
        onCreate={createGoal}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
      />

      <ContributeDialog
        open={!!contributingGoal}
        onOpenChange={(o) => { if (!o) setContributingGoal(null); }}
        goal={contributingGoal}
        onContribute={contributeGoal}
      />
    </div>
  );
}
