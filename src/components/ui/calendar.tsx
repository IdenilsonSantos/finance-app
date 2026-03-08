"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={ptBR}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "relative flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 items-center h-7",
        caption_label: "text-sm font-semibold capitalize",
        nav: "absolute top-1 left-0 right-0 flex justify-between items-center",
        button_previous:
          "h-7 w-7 bg-transparent p-0 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors text-slate-500 hover:text-slate-900",
        button_next:
          "h-7 w-7 bg-transparent p-0 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors text-slate-500 hover:text-slate-900",
        month_grid: "w-full border-collapse",
        weekdays: "",
        weekday: "text-slate-400 w-9 font-medium text-[0.8rem] text-center pb-1",
        weeks: "",
        week: "",
        day: "relative p-0 text-center text-sm",
        day_button: cn(
          "h-9 w-9 mx-auto p-0 font-normal rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-slate-100 aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-[#1E1E2D] [&>button]:text-white [&>button]:hover:bg-slate-800 [&>button]:rounded-lg",
        today: "[&>button]:font-bold [&>button]:text-slate-900",
        outside: "[&>button]:text-slate-300 [&>button]:opacity-50",
        disabled: "[&>button]:text-slate-300 [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
