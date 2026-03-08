"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MonthDateStripProps {
  selectedMonth: Date;
  selectedDay: number | null;
  activeDates?: string[];
  onMonthChange: (date: Date) => void;
  onDayChange: (day: number | null) => void;
}

export function MonthDateStrip({
  selectedMonth,
  selectedDay,
  activeDates = [],
  onMonthChange,
  onDayChange,
}: MonthDateStripProps) {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    el.addEventListener("scroll", update, { passive: true });
    update();
    return () => el.removeEventListener("scroll", update);
  }, [selectedMonth]);

  const scrollStrip = (dir: "left" | "right") =>
    viewportRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });

  const prevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
    onDayChange(null);
  };

  const nextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
    onDayChange(null);
  };

  const goToToday = () => {
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
    onDayChange(today.getDate());
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-[#1E1E2D] text-white rounded-2xl px-3 py-2 text-sm font-bold tracking-wider select-none">
            <button onClick={prevMonth} className="hover:text-slate-300 transition-colors" aria-label="Mês anterior">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[100px] sm:min-w-[120px] text-center text-xs sm:text-sm">
              {format(selectedMonth, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
            </span>
            <button onClick={nextMonth} className="hover:text-slate-300 transition-colors" aria-label="Próximo mês">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hoje</span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-1 border border-slate-200 rounded-2xl px-2 py-1.5">
          <button
            onClick={() => scrollStrip("left")}
            disabled={!canScrollLeft}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollStrip("right")}
            disabled={!canScrollRight}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea viewportRef={viewportRef}>
        <div className="flex gap-1 pb-4">
          <button
            onClick={() => onDayChange(null)}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-14 rounded-2xl shrink-0 transition-all gap-0.5",
              selectedDay === null
                ? "bg-[#1E1E2D] text-white"
                : "text-slate-400 hover:bg-slate-50",
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">TUDO</span>
          </button>

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const abbr = format(date, "EEE", { locale: ptBR }).toUpperCase().slice(0, 3);
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;
            const isSelected = selectedDay === day;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasTx = activeDates.includes(dateStr);

            return (
              <button
                key={day}
                onClick={() => onDayChange(isSelected ? null : day)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-12 h-14 rounded-2xl shrink-0 transition-all gap-0.5",
                  isSelected
                    ? "bg-[#1E1E2D] text-white"
                    : isToday
                      ? "bg-slate-50 text-slate-800 hover:bg-slate-100"
                      : "text-slate-400 hover:bg-slate-50",
                )}
              >
                {isToday && !isSelected && (
                  <span className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                <span className="text-[9px] font-bold uppercase tracking-wide">{abbr}</span>
                <span className="text-sm font-bold">{String(day).padStart(2, "0")}</span>
                {hasTx && !isSelected && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
