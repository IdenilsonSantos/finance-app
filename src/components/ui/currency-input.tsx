"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

// Formats a raw numeric string to "1.234,56" display
function toDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Converts display back to raw decimal string "1234.56"
function toRaw(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toFixed(2);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, disabled, ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => {
      if (!value) return "";
      const num = parseFloat(value);
      if (isNaN(num)) return "";
      return (num * 100).toFixed(0).replace(/\D/g, "") === ""
        ? ""
        : toDisplay(Math.round(num * 100).toString());
    });

    // Sync display when value prop changes (e.g. form reset via key)
    const prevValueRef = React.useRef(value);
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const next = value
        ? toDisplay(Math.round(parseFloat(value) * 100).toString())
        : "";
      if (next !== display) setDisplay(next);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value.replace(/\D/g, "");
      const next = raw ? toDisplay(raw) : "";
      setDisplay(next);
      onChange?.(raw ? toRaw(raw) : "");
    }

    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none select-none">
          R$
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={display}
          onChange={handleChange}
          className={cn(
            "flex h-12 w-full rounded-2xl border-2 border-gray-200 bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-gray-400 transition-all disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
