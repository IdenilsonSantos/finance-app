"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, CalendarClock } from "lucide-react";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DashboardGoal } from "@/types/api";
import { formatCurrency } from "@/lib/format";

interface GoalsCardProps {
  goals: DashboardGoal[];
  averageSavings: number;
  currentMonthSavings: number;
}

export function GoalsCard({ goals, averageSavings }: GoalsCardProps) {
  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl flex flex-col h-[445px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-slate-900">
            Metas Financeiras
          </CardTitle>
          <p className="text-sm text-slate-500">Acompanhe seus objetivos</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 px-6 pb-6">
      <ScrollArea className="h-full pr-2">
      <div className="space-y-6 pb-2">
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
          goals.map((goal) => {
            const progress = Math.min(goal.percentage, 100);
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            let forecastMessage = "";
            let forecastDate = null;

            if (remainingAmount > 0 && averageSavings > 10) {
              const monthsToGoal = Math.ceil(remainingAmount / averageSavings);
              forecastDate = addMonths(new Date(), monthsToGoal);
              if (monthsToGoal > 12 * 50) {
                forecastMessage = "Previsão: Longo prazo";
                forecastDate = null;
              } else {
                forecastMessage = `Previsão: ${format(forecastDate, "MMMM 'de' yyyy", { locale: ptBR })}`;
              }
            } else if (remainingAmount <= 0) {
              forecastMessage = "Meta alcançada!";
            } else {
              forecastMessage = "Economia mensal insuficiente para previsão";
            }

            return (
              <div key={goal.id} className="space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{goal.name}</h4>
                    <p
                      className={cn(
                        "text-[10px] sm:text-xs mt-1 font-medium",
                        remainingAmount <= 0 ? "text-emerald-500" : "text-slate-500",
                      )}
                    >
                      {forecastMessage}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      {progress.toFixed(0)}%
                    </span>
                    <div className="text-sm font-bold text-slate-900">
                      <span className="text-emerald-600">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-slate-300 font-normal mx-0.5">/</span>
                      <span className="text-slate-500">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {forecastDate && (
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50/50 w-fit px-2.5 py-1 rounded-xl font-medium border border-emerald-100/20">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Até {format(forecastDate, "MMM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </ScrollArea>
      </CardContent>
    </Card>
  );
}
