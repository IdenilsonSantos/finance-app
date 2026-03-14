"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface FilterTabsProps {
  tabs: readonly FilterTabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: "dark" | "pill";
}

export function FilterTabs({ tabs, value, onChange, variant = "dark" }: FilterTabsProps) {
  if (variant === "pill") {
    return (
      <div className="flex gap-1 bg-slate-50 p-1 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
              value === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all cursor-pointer",
            value === tab.id
              ? "bg-[#1E1E2D] text-white"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
          )}
        >
          <tab.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
