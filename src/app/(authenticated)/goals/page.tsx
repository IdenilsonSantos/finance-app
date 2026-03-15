"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { GoalFormDialog } from "@/components/goals/GoalFormDialog";
import { ContributeDialog } from "@/components/goals/ContributeDialog";
import { useGoals } from "@/hooks/useGoals";
import { GoalResponse } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Plus,
  Target,
  CheckCircle2,
  TrendingUp,
  Pencil,
  PiggyBank,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isWithinInterval, addDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Pulse key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => <Pulse key={i} className="h-44" />)}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  format?: (v: number) => string;
  color: string;
}

function StatCard({ label, value, icon: Icon, format: fmt, color }: StatCardProps) {
  const animated = useCountUp(value, { duration: 800 });
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{fmt ? fmt(animated) : animated.toFixed(0)}</p>
        </div>
        <div className="p-2 rounded-xl" style={{ backgroundColor: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: GoalResponse;
  onEdit: (goal: GoalResponse) => void;
  onContribute: (goal: GoalResponse) => void;
}

function GoalCard({ goal, onEdit, onContribute }: GoalCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  const animatedCurrent = useCountUp(goal.currentAmount, { duration: 900 });
  const animatedTarget = useCountUp(goal.targetAmount, { duration: 900 });

  let deadlineLabel: string | null = null;
  let deadlineWarning = false;
  if (goal.deadline && !isComplete) {
    const dl = new Date(goal.deadline);
    if (isPast(dl)) {
      deadlineLabel = "Prazo encerrado";
      deadlineWarning = true;
    } else if (isWithinInterval(dl, { start: new Date(), end: addDays(new Date(), 30) })) {
      deadlineLabel = `Vence em ${format(dl, "dd/MM/yyyy")}`;
      deadlineWarning = true;
    } else {
      deadlineLabel = `Prazo: ${format(dl, "dd 'de' MMM. yyyy", { locale: ptBR })}`;
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white"
            style={{ backgroundColor: goal.color }}
          >
            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{goal.name}</h3>
            {deadlineLabel && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-medium mt-0.5",
                deadlineWarning ? "text-amber-500" : "text-slate-400",
              )}>
                {deadlineWarning && <AlertTriangle className="w-3 h-3" />}
                <span>{deadlineLabel}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onContribute(goal)}
            disabled={isComplete}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: goal.color + "20" }}
            title="Contribuir"
          >
            <PiggyBank className="w-3.5 h-3.5" style={{ color: goal.color }} />
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">Acumulado</p>
          <p className="text-xl font-bold" style={{ color: isComplete ? "#10b981" : goal.color }}>
            {formatCurrency(animatedCurrent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 mb-1">Meta</p>
          <p className="text-sm font-semibold text-slate-500">{formatCurrency(animatedTarget)}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: mounted ? `${progress}%` : "0%",
              backgroundColor: isComplete ? "#10b981" : goal.color,
            }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold" style={{ color: isComplete ? "#10b981" : goal.color }}>
            {progress.toFixed(0)}%
          </span>
          {!isComplete && (
            <span className="text-[11px] text-slate-400">
              Faltam {formatCurrency(remaining)}
            </span>
          )}
          {isComplete && (
            <span className="text-[11px] font-semibold text-emerald-500">Meta alcançada!</span>
          )}
        </div>
      </div>

      {!isComplete && goal.currentAmount > 0 && (
        <div
          className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-xl w-fit border"
          style={{ color: goal.color, backgroundColor: goal.color + "15", borderColor: goal.color + "30" }}
        >
          <CalendarClock className="w-3 h-3" />
          <span>Previsão indisponível sem taxa de poupança</span>
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const { goals, loading, error, createGoal, updateGoal, deleteGoal, contributeGoal } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GoalResponse | null>(null);
  const [contributing, setContributing] = useState<GoalResponse | null>(null);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const inProgress = goals.length - completed;

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(goal: GoalResponse) { setEditing(goal); setDialogOpen(true); }
  function openContribute(goal: GoalResponse) { setContributing(goal); }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header
        title="Metas Financeiras"
        subtitle="Acompanhe e gerencie seus objetivos"
        actions={
          <Button
            onClick={openCreate}
            className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova meta
          </Button>
        }
      />

      <div className="flex-1 p-4 md:p-8 space-y-6">
        {loading ? (
          <GoalsSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total acumulado" value={totalCurrent} icon={TrendingUp} format={formatCurrency} color="#10b981" />
              <StatCard label="Total das metas" value={totalTarget} icon={Target} format={formatCurrency} color="#3b82f6" />
              <StatCard label="Metas concluídas" value={completed} icon={CheckCircle2} color="#a855f7" />
            </div>
            
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-white rounded-3xl shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Nenhuma meta definida</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Crie objetivos financeiros para poupar com propósito e acompanhar seu progresso
                  </p>
                </div>
                <Button
                  onClick={openCreate}
                  className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar primeira meta
                </Button>
              </div>
            ) : (
              <div>
                {inProgress > 0 && (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Em progresso ({inProgress})
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals
                    .filter((g) => g.currentAmount < g.targetAmount)
                    .map((goal) => (
                      <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onContribute={openContribute} />
                    ))}
                </div>

                {completed > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6">
                      Concluídas ({completed})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {goals
                        .filter((g) => g.currentAmount >= g.targetAmount)
                        .map((goal) => (
                          <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onContribute={openContribute} />
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        onCreate={createGoal}
        onUpdate={updateGoal}
        onDelete={editing ? deleteGoal : undefined}
      />

      <ContributeDialog
        open={!!contributing}
        onOpenChange={(o) => { if (!o) setContributing(null); }}
        goal={contributing}
        onContribute={contributeGoal}
      />
    </div>
  );
}
