"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { ReportCategory } from "@/types/api";
import { monthLabel } from "./format";

/** Evolução mês a mês de uma categoria (uma série: o título a identifica). */
export function CategoryTrendChart({ category }: { category: ReportCategory }) {
  const style = getCategoryStyle(category.category);
  const data = category.months.map((m) => ({ ...m, label: monthLabel(m.month) }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
            formatter={(value) => [formatCurrency(Number(value) || 0), style.label]}
            contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={style.color}
            strokeWidth={2}
            dot={{ r: 4, fill: style.color, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
