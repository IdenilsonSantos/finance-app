"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  /** Permite valores negativos: digitar "-" torna o valor negativo; apagá-lo volta a positivo. */
  allowNegative?: boolean;
}

// Formats a raw numeric string to "1.234,56" display
function toDisplay(raw: string, negative = false): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return negative ? "-" : "";
  const cents = parseInt(digits, 10);
  const formatted = (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return negative ? `-${formatted}` : formatted;
}

function fromValue(value: string | undefined): string {
  if (!value) return "";
  const num = parseFloat(value);
  if (isNaN(num)) return "";
  return toDisplay(Math.round(Math.abs(num) * 100).toString(), num < 0);
}

// Converts display back to raw decimal string "1234.56"
function toRaw(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (!digits) return "";
  return (parseInt(digits, 10) / 100).toFixed(2);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, disabled, allowNegative = false, ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => fromValue(value));

    // Sync display when value prop changes (e.g. form reset via key)
    const prevValueRef = React.useRef(value);
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const next = fromValue(value);
      // Keep a lone "-" typed by the user while the value is still empty.
      if (next !== display && !(display === "-" && !value)) setDisplay(next);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const negative = allowNegative && e.target.value.includes("-");
      const raw = e.target.value.replace(/\D/g, "");
      setDisplay(raw || negative ? toDisplay(raw, negative) : "");
      if (!raw) {
        onChange?.("");
        return;
      }
      const decimal = toRaw(raw);
      onChange?.(negative && parseFloat(decimal) !== 0 ? `-${decimal}` : decimal);
    }

    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium pointer-events-none select-none">
          R$
        </span>
        <input
          ref={ref}
          type="text"
          inputMode={allowNegative ? "text" : "numeric"}
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
