"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { DashboardCashFlowItem } from "@/types/api";
import { formatCurrency } from "@/lib/format";

interface CashFlowChartProps {
  data: DashboardCashFlowItem[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  if (!data || data.length < 2) {
    return (
      <Card className="shadow-sm border-none bg-white rounded-3xl p-6 h-full">
        <div className="flex items-center justify-center h-[300px] text-slate-400">
          Dados insuficientes para análise de fluxo
        </div>
      </Card>
    );
  }

  const currentMonth = data[data.length - 1];
  const lastMonth = data[data.length - 2];
  const currentVolume = currentMonth.income + currentMonth.expenses;
  const lastVolume = lastMonth.income + lastMonth.expenses;
  const volumeGrowth =
    lastVolume !== 0 ? ((currentVolume - lastVolume) / lastVolume) * 100 : 0;

  const chartData = data.map((d) => ({
    ...d,
    income: d.income / 100,
    expenses: d.expenses / 100,
  }));

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-slate-900">
            Fluxo de Caixa
          </CardTitle>
          <p className="text-sm text-slate-500">
            Evolução de receitas e despesas (6 meses)
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
          <TrendingUp className="w-4 h-4 text-slate-600" />
          <span
            className={`text-xs font-bold ${volumeGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {volumeGrowth > 0 ? "+" : ""}
            {volumeGrowth.toFixed(1)}% Vol.
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                formatter={(value: number) => [
                  formatCurrency(value * 100),
                  undefined,
                ]}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}
              />
              <Line
                name="Receitas"
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                name="Despesas"
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
