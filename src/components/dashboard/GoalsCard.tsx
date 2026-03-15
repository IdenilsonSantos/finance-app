"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, CalendarClock, AlertTriangle, PiggyBank, Pencil, ArrowRight } from "lucide-react";
import Link from "next/link";
import { addMonths, format, isPast, isWithinInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DashboardGoal } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";

interface GoalsCardProps {
  goals: DashboardGoal[];
  averageSavings: number;
  currentMonthSavings: number;
  onEdit?: (goal: DashboardGoal) => void;
  onContribute?: (goal: DashboardGoal) => void;
}

interface GoalRowProps {
  goal: DashboardGoal;
  averageSavings: number;
  onEdit?: (goal: DashboardGoal) => void;
  onContribute?: (goal: DashboardGoal) => void;
}

function GoalRow({ goal, averageSavings, onEdit, onContribute }: GoalRowProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const progress = Math.min(goal.percentage, 100);
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const isComplete = remainingAmount <= 0;

  const animatedCurrent = useCountUp(goal.currentAmount, { duration: 900 });
  const animatedTarget = useCountUp(goal.targetAmount, { duration: 900 });

  // Deadline status
  let deadlineLabel: string | null = null;
  let deadlineWarning = false;
  if (goal.deadline) {
    const dl = new Date(goal.deadline);
    if (!isComplete) {
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
  }

  // Forecast
  let forecastMessage = "";
  let forecastDate: Date | null = null;
  if (isComplete) {
    forecastMessage = "Meta alcançada!";
  } else if (averageSavings > 10) {
    const monthsToGoal = Math.ceil(remainingAmount / averageSavings);
    if (monthsToGoal > 12 * 50) {
      forecastMessage = "Previsão: Longo prazo";
    } else {
      forecastDate = addMonths(new Date(), monthsToGoal);
      forecastMessage = `Previsão: ${format(forecastDate, "MMM/yyyy", { locale: ptBR })}`;
    }
  } else {
    forecastMessage = "Economia insuficiente para previsão";
  }

  return (
    <div className="space-y-3 group">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: goal.color }}
          />
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900 text-sm truncate">{goal.name}</h4>
            <p className={cn(
              "text-[10px] sm:text-xs mt-0.5 font-medium",
              isComplete ? "text-emerald-500" : "text-slate-400",
            )}>
              {forecastMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(onContribute || onEdit) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
              {onContribute && !isComplete && (
                <button
                  onClick={() => onContribute(goal)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: goal.color + "20" }}
                  title="Contribuir"
                >
                  <PiggyBank className="w-3 h-3" style={{ color: goal.color }} />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(goal)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold block"
              style={{ color: isComplete ? "#10b981" : goal.color }}>
              {progress.toFixed(0)}%
            </span>
            <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
              <span style={{ color: goal.color }}>
                {formatCurrency(animatedCurrent)}
              </span>
              <span className="text-slate-300 font-normal mx-0.5">/</span>
              <span className="text-slate-500 text-xs">
                {formatCurrency(animatedTarget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: mounted ? `${progress}%` : "0%",
            backgroundColor: isComplete ? "#10b981" : goal.color,
          }}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {forecastDate && !isComplete && (
          <div className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-xl border w-fit"
            style={{
              color: goal.color,
              backgroundColor: goal.color + "15",
              borderColor: goal.color + "30",
            }}>
            <CalendarClock className="w-3 h-3 shrink-0" />
            <span>{format(forecastDate, "MMM/yyyy", { locale: ptBR })}</span>
          </div>
        )}
        {deadlineLabel && (
          <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-xl border w-fit",
            deadlineWarning
              ? "text-amber-600 bg-amber-50 border-amber-100"
              : "text-slate-400 bg-slate-50 border-slate-100",
          )}>
            {deadlineWarning && <AlertTriangle className="w-3 h-3 shrink-0" />}
            <span>{deadlineLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GoalsCard({ goals, averageSavings, onEdit, onContribute }: GoalsCardProps) {
  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl flex flex-col h-[445px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-slate-900">
            Metas Financeiras
          </CardTitle>
          <p className="text-sm text-slate-500">Acompanhe seus objetivos</p>
        </div>
        <Link
          href="/goals"
          className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          <span>Ver Todas</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 px-6 pb-6">
        <ScrollArea className="h-full">
          <div className="space-y-6 pb-2 pr-4">
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Nenhuma meta definida
                </p>
                <p className="text-xs text-slate-400 max-w-[180px]">
                  Defina objetivos financeiros para poupar com propósito e foco
                </p>
              </div>
            ) : (
              goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  averageSavings={averageSavings}
                  onEdit={onEdit}
                  onContribute={onContribute}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
