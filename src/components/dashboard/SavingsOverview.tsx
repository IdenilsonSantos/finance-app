"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSavingsItem } from "@/types/api";
import { formatCurrency } from "@/lib/format";

interface SavingsOverviewProps {
  data: DashboardSavingsItem[];
}

export function SavingsOverview({ data }: SavingsOverviewProps) {
  if (!data || data.length < 2) {
    return (
      <Card className="shadow-sm border-none bg-white rounded-3xl p-6">
        <div className="flex items-center justify-center h-[300px] text-slate-400">
          Dados insuficientes para análise de economia
        </div>
      </Card>
    );
  }

  const currentMonth = data[data.length - 1];
  const lastMonth = data[data.length - 2];

  const savingsGrowth =
    lastMonth.savings !== 0
      ? ((currentMonth.savings - lastMonth.savings) / Math.abs(lastMonth.savings)) * 100
      : 0;

  const savingsRate =
    currentMonth.income !== 0
      ? (currentMonth.savings / currentMonth.income) * 100
      : 0;

  const averageIncome = data.reduce((acc, curr) => acc + curr.income, 0) / data.length;
  const averageExpenses = data.reduce((acc, curr) => acc + curr.expenses, 0) / data.length;
  const averageSavings = data.reduce((acc, curr) => acc + curr.savings, 0) / data.length;

  const chartData = data.map((d) => ({
    ...d,
    savings: d.savings / 100,
  }));

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-slate-900">
            Análise de Economia
          </CardTitle>
          <p className="text-sm text-slate-500">Visão detalhada do seu saldo mensal</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full self-start sm:self-auto">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">
            {savingsRate > 0 ? "+" : ""}
            {savingsRate.toFixed(1)}% Taxa de Poupança
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-3 flex flex-col gap-4 justify-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-500">Economia Atual</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(currentMonth.savings)}
              </span>
            </div>
            <div
              className={cn(
                "text-xs font-medium mt-1 flex items-center",
                savingsGrowth >= 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              {savingsGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(savingsGrowth).toFixed(0)}% vs mês anterior
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Receita Média</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(averageIncome)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Despesa Média</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(averageExpenses)}
              </span>
            </div>
            <div className="h-px bg-slate-100 my-2" />
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-900">Economia Média</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(averageSavings)}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-9 h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DashboardSavingsItem;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
                        <p className="font-bold mb-2 text-slate-900">{label}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4 text-emerald-600">
                            <span>Receita:</span>
                            <span className="font-semibold">{formatCurrency(d.income)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-red-500">
                            <span>Despesa:</span>
                            <span className="font-semibold">{formatCurrency(d.expenses)}</span>
                          </div>
                          <div className="h-px bg-slate-100 my-1" />
                          <div
                            className={cn(
                              "flex justify-between gap-4 font-bold",
                              d.savings >= 0 ? "text-emerald-700" : "text-red-600",
                            )}
                          >
                            <span>Saldo:</span>
                            <span>{formatCurrency(d.savings)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#e2e8f0" />
              <Bar dataKey="savings" radius={[6, 6, 6, 6]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.savings >= 0 ? "#10b981" : "#ef4444"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
