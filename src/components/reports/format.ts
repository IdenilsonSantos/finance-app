import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** "2024-03" -> "mar/24" (ou "março de 2024" com `long`). */
export function monthLabel(month: string, long = false): string {
  const date = new Date(`${month}-01T12:00:00`);
  return format(date, long ? "MMMM 'de' yyyy" : "MMM/yy", { locale: ptBR });
}

/** Variação em % com sinal ("+12%", "-3%"); "novo" quando não havia base. */
export function changeLabel(change: number | null): string {
  if (change === null) return "novo";
  const pct = Math.round(change * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits).replace(".", ",")}%`;
}
