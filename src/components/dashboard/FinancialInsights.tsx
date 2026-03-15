"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, Target, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { DashboardFinancialInsights } from "@/types/api";

interface FinancialInsightsProps {
  data: DashboardFinancialInsights;
}

export function FinancialInsights({ data }: FinancialInsightsProps) {
  const {
    totalBalance,
    reservedForGoals,
    availableLiquidity,
    projectedBalance,
    remainingBudget,
    monthlyGoalsTarget,
    isOverBudget,
    savingsRate,
    monthExpenses,
    monthSavings,
  } = data;

  const aAvailableLiquidity = useCountUp(availableLiquidity);
  const aTotalBalance = useCountUp(totalBalance);
  const aReservedForGoals = useCountUp(reservedForGoals);
  const aProjectedBalance = useCountUp(projectedBalance);
  const aMonthExpenses = useCountUp(monthExpenses);
  const aMonthSavings = useCountUp(monthSavings);
  const aRemainingBudget = useCountUp(remainingBudget);
  const aMonthlyGoalsTarget = useCountUp(monthlyGoalsTarget);
  const aSavingsRate = useCountUp(savingsRate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden md:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Liquidez e Disponibilidade
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900">
                    {formatCurrency(aAvailableLiquidity)}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">
                    Líquido Disponível
                  </p>
                </div>

                <div className="flex flex-col justify-center gap-1">
                  <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-500">Saldo Total</span>
                    <span className="font-bold text-slate-700">
                      {formatCurrency(aTotalBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                    <span className="text-slate-500">Reserva p/ Metas</span>
                    <span className="font-bold text-amber-600">
                      - {formatCurrency(aReservedForGoals)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2">
                  <Target className="w-3 h-3" />
                  Projeção Fim do Mês
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span
                    className={cn(
                      "text-lg font-bold",
                      projectedBalance >= 0 ? "text-slate-900" : "text-red-600",
                    )}
                  >
                    {formatCurrency(aProjectedBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Saldo Final = Disponível + Renda - Gastos - Metas
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Gasto mensal
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {formatCurrency(aMonthExpenses)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Disponível p/ Gastar
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {formatCurrency(aRemainingBudget)}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Economia (Mês)
                </p>
                <p
                  className={cn(
                    "text-sm font-bold",
                    monthSavings >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {monthSavings >= 0 ? "+" : ""}
                  {formatCurrency(aMonthSavings)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Ideal p/ Metas
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {formatCurrency(aMonthlyGoalsTarget)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "border-none shadow-sm rounded-3xl p-6 flex flex-col justify-between transition-all duration-500",
          projectedBalance < 0
            ? "bg-red-50 text-red-900 border border-red-100"
            : projectedBalance < monthlyGoalsTarget * 0.5
              ? "bg-amber-50 text-amber-900 border border-amber-100 shadow-amber-100/20"
              : isOverBudget
                ? "bg-slate-50 text-slate-900 border border-slate-100"
                : "bg-white text-slate-900",
        )}
      >
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "p-2 rounded-xl backdrop-blur-sm",
              projectedBalance < 0
                ? "bg-red-100 text-red-600"
                : projectedBalance < monthlyGoalsTarget * 0.5
                  ? "bg-amber-100 text-amber-600"
                  : isOverBudget
                    ? "bg-slate-200 text-slate-600"
                    : "bg-emerald-50 text-emerald-600",
            )}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
            Viabilidade
          </span>
        </div>
        <div className="mt-4">
          <h4 className="font-bold text-lg leading-tight tracking-tight">
            {projectedBalance < 0
              ? "Ajuste Necessário"
              : projectedBalance < monthlyGoalsTarget * 0.5
                ? "Margem Apertada"
                : isOverBudget
                  ? "Orçamento Excedido"
                  : "Plano Concluído"}
          </h4>
          <p className="text-xs mt-1.5 opacity-70 leading-relaxed">
            {projectedBalance < 0
              ? "Seu ritmo de gasto compromete o cumprimento das metas. Tente reduzir despesas variáveis."
              : projectedBalance < monthlyGoalsTarget * 0.5
                ? "Sua reserva de segurança para este mês está baixa. Evite gastos extras inesperados."
                : isOverBudget
                  ? "Você ultrapassou o limite das categorias, mas seu saldo final ainda é positivo."
                  : "Excelente! Você está poupando e gastando em perfeito equilíbrio com seus objetivos."}
          </p>
        </div>
      </Card>

      <Card className="bg-slate-900 text-white border-none shadow-sm rounded-3xl p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-slate-800 rounded-xl text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase opacity-60 text-slate-400">
            Taxa de Poupança
          </span>
        </div>
        <div className="mt-4">
          <h4 className="font-bold text-3xl">
            {aSavingsRate < -100 ? "-100" : aSavingsRate.toFixed(0)}%
          </h4>
          <div
            className={cn(
              "flex items-center gap-1 text-xs mt-1",
              savingsRate >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {savingsRate >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {savingsRate >= 0 ? "da sua renda guardada" : "da sua renda excedida"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
