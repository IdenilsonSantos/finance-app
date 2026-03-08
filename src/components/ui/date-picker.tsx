"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, disabled, placeholder = "Selecione uma data", className }: DatePickerProps) {
  const selected = value ? new Date(value + "T12:00:00") : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date || !onChange) return;
    onChange(format(date, "yyyy-MM-dd"));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-12 rounded-2xl border-2 border-gray-200 bg-background px-4 justify-between font-normal text-sm hover:bg-background focus:border-gray-400 transition-all",
            !selected && "text-muted-foreground/60",
            className,
          )}
        >
          <span>
            {selected
              ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
