"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (page > 3) pages.push("...");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (page < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50">
      <p className="text-xs text-slate-400">
        Exibindo <span className="font-semibold text-slate-600">{from}–{to}</span> de{" "}
        <span className="font-semibold text-slate-600">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 p-0 rounded-xl border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="flex items-center justify-center h-8 w-8 text-slate-400">
              <MoreHorizontal className="w-4 h-4" />
            </span>
          ) : (
            <Button
              key={p}
              variant="outline"
              size="sm"
              onClick={() => onPageChange(p)}
              className={cn(
                "h-8 w-8 p-0 rounded-xl text-xs font-medium transition-colors",
                p === page
                  ? "bg-[#1E1E2D] text-white border-[#1E1E2D] hover:bg-slate-700 hover:text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 w-8 p-0 rounded-xl border-slate-200"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
