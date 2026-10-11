"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { ReportResponse } from "@/types/api";
import { monthLabel } from "./format";

// Mesmas cores do fluxo de caixa do dashboard (validadas para daltonismo;
// o verde tem contraste baixo, por isso há legenda e a tabela abaixo).
const INCOME = "#10b981";
const EXPENSE = "#ef4444";

export function MonthlyChart({ months }: { months: ReportResponse["months"] }) {
  const data = months.map((m) => ({ ...m, label: monthLabel(m.month) }));
  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={64}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(v: number) => formatCurrencyCompact(v)}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(value, name) => [formatCurrency(Number(value) || 0), name]}
              contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
            <Bar dataKey="income" name="Receitas" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" name="Despesas" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-400">
              <th className="text-left font-semibold py-2">Mês</th>
              <th className="text-right font-semibold py-2">Receitas</th>
              <th className="text-right font-semibold py-2">Despesas</th>
              <th className="text-right font-semibold py-2">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {months.map((m) => (
              <tr key={m.month}>
                <td className="py-2 text-slate-600 capitalize">{monthLabel(m.month, true)}</td>
                <td className="py-2 text-right tabular-nums text-slate-700">{formatCurrency(m.income)}</td>
                <td className="py-2 text-right tabular-nums text-slate-700">{formatCurrency(m.expense)}</td>
                <td
                  className={`py-2 text-right tabular-nums font-semibold ${m.balance < 0 ? "text-red-600" : "text-slate-900"}`}
                >
                  {formatCurrency(m.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
