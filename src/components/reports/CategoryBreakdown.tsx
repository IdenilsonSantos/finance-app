"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { getCategoryStyle } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ReportCategory } from "@/types/api";
import { changeLabel, percent } from "./format";

interface Props {
  categories: ReportCategory[];
  type: "income" | "expense";
  selected?: string | null;
  onSelect?: (category: string) => void;
}

/**
 * Categorias do período, da maior para a menor, com participação e variação
 * em relação ao período anterior. Em despesas, aumentar é ruim (vermelho);
 * em receitas, é bom (verde). A cor da barra é a da categoria (identidade),
 * nunca a da posição no ranking.
 */
export function CategoryBreakdown({ categories, type, selected, onSelect }: Props) {
  const items = categories.filter((c) => c.type === type && (c.total > 0 || c.previousTotal > 0));
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">Nada no período.</p>;
  }

  return (
    <ul className="divide-y divide-slate-50">
      {items.map((c) => {
        const style = getCategoryStyle(c.category);
        const Icon = style.icon;
        const up = c.change !== null && c.change > 0;
        const good = type === "income" ? up : !up;
        const isSelected = selected === c.category;
        return (
          <li key={c.category}>
            <button
              type="button"
              onClick={() => onSelect?.(c.category)}
              disabled={!onSelect}
              className={cn(
                "w-full text-left px-6 py-3 flex items-center gap-3 transition-colors",
                onSelect && "hover:bg-slate-50/70",
                isSelected && "bg-slate-50",
              )}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: style.color + "20" }}
              >
                <Icon className="w-4 h-4" style={{ color: style.color }} />
              </span>
              <span className="flex-1 min-w-0 space-y-1.5">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800 truncate">{style.label}</span>
                  <span className="text-sm font-bold tabular-nums text-slate-900 whitespace-nowrap">
                    {formatCurrency(c.total)}
                  </span>
                </span>
                <span className="block h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(c.share * 100, c.total > 0 ? 2 : 0)}%`, backgroundColor: style.color }}
                  />
                </span>
                <span className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {percent(c.share)} do total · {c.count} lançamento{c.count === 1 ? "" : "s"}
                  </span>
                  {(c.change !== null || c.total > 0) && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 font-semibold",
                        c.change === null ? "text-slate-400" : c.change === 0 ? "text-slate-500" : good ? "text-emerald-600" : "text-red-500",
                      )}
                      title="Variação em relação ao período anterior"
                    >
                      {c.change !== null && c.change !== 0 && (up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                      {changeLabel(c.change)}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
