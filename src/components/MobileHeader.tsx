"use client";

import { useSidebar } from "@/components/providers/SidebarContext";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileHeader() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="flex md:hidden items-center justify-between p-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1E1E2D] text-white shrink-0">
          <span className="font-bold text-lg font-sans">M</span>
        </div>
        <span className="font-bold text-lg text-[#1E1E2D] font-sans">
          Finance.
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
        <Menu className="h-6 w-6 text-[#1E1E2D]" />
      </Button>
    </header>
  );
}
