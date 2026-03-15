"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardCategoryItem } from "@/types/api";
import { CATEGORY_STYLES, getCategoryStyle } from "@/lib/categories";

export { CATEGORY_STYLES };

interface ExpensesByCategoryChartProps {
  data: DashboardCategoryItem[];
}

export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm border-none bg-white rounded-3xl h-[445px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">
            Gastos por Categoria
          </CardTitle>
          <p className="text-sm text-slate-500">Distribuição mensal</p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <PieChartIcon className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-900 font-bold text-base mb-1">
            Nada por aqui ainda
          </p>
          <p className="text-slate-400 text-xs max-w-[200px] leading-relaxed">
            Seus gastos aparecerão aqui assim que você registrar suas primeiras despesas do mês
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeItem = activeIndex !== undefined ? data[activeIndex] : null;
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="shadow-sm border-none bg-white rounded-3xl h-[445px] flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-bold text-slate-900">
          Gastos por Categoria
        </CardTitle>
        <p className="text-sm text-slate-500">Distribuição mensal</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-[220px] w-full relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                cornerRadius={5}
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {data.map((entry, index) => {
                  const style = getCategoryStyle(entry.category);
                  const isActive = activeIndex === index;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={style.color}
                      opacity={activeIndex !== undefined ? (activeIndex === index ? 1 : 0.3) : 1}
                      stroke={isActive ? style.color : "none"}
                      strokeWidth={isActive ? 2 : 0}
                      style={{ filter: isActive ? `drop-shadow(0 0 8px ${style.color}40)` : "none" }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none flex flex-col justify-center items-center w-32">
            {activeItem ? (
              <>
                <span className="text-xs text-slate-500 font-semibold block mb-0.5 uppercase tracking-wider truncate w-full">
                  {getCategoryStyle(activeItem.category).label}
                </span>
                <span className="text-lg font-bold text-slate-900 block leading-tight">
                  <span className="text-xs align-top mr-0.5">R$</span>
                  {(activeItem.value / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-emerald-600 font-bold block mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {activeItem.percentage.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider mb-0.5">
                  Total
                </span>
                <span className="text-xl font-extrabold text-slate-900">
                  <span className="text-sm align-top mr-0.5 font-bold text-slate-500">R$</span>
                  {(totalValue / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </span>
              </>
            )}
          </div>
        </div>

        <ScrollArea className="h-[160px] mt-4 px-2 -mr-2">
          <div className="space-y-3 pb-2 pr-4">
            {data.map((item, index) => {
              const style = getCategoryStyle(item.category);
              const isActive = activeIndex === index;
              return (
                <div
                  key={item.category}
                  className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                    isActive ? "bg-slate-50 ring-1 ring-slate-200" : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
                    <span className={`text-xs font-medium ${isActive ? "text-slate-900 font-bold" : "text-slate-600"}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs ${isActive ? "text-slate-900 font-bold" : "text-slate-900"}`}>
                      {item.percentage.toFixed(0)}%
                    </span>
                    <span className="text-xs text-slate-400 w-16 text-right">
                      R${(item.value / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
