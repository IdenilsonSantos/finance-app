"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  iconClassName?: string;
  footer?: ReactNode;
  variant?: "dark" | "light";
  valueClassName?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  format = (n) => String(Math.round(n)),
  icon: Icon,
  iconClassName = "bg-slate-100 text-slate-500",
  footer,
  variant = "light",
  valueClassName,
  loading = false,
}: StatCardProps) {
  const animated = useCountUp(value, { enabled: !loading });

  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "rounded-3xl p-6",
        isDark ? "bg-[#1E1E2D] text-white" : "bg-white shadow-sm",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wider mb-3",
              isDark ? "text-slate-400" : "text-slate-400",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-bold",
              isDark ? "text-white" : "text-slate-900",
              valueClassName,
            )}
          >
            {format(animated)}
          </p>
        </div>
        <div className={cn("p-2 rounded-xl shrink-0", iconClassName)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {footer && (
        <div
          className={cn(
            "mt-4 text-xs font-semibold",
            isDark ? "text-slate-500" : "text-slate-500",
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
