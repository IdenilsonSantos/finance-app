"use client";

import { useSidebar } from "@/components/providers/SidebarContext";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function MobileHeader() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="flex md:hidden items-center justify-between p-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Logo variant="mini" className="w-8 h-8 rounded-lg" />
        <span className="font-bold text-lg text-[#1E1E2D] font-sans">
          Finance.
        </span>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 data-[state=open]:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              <Link
                href="/settings?tab=notifications"
                className="text-xs text-[#8B8C9E] hover:text-[#1E1E2D] font-normal"
              >
                Configurar
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Bell className="w-8 h-8 text-gray-200" />
              <p className="text-sm font-medium text-slate-500">
                Nenhuma notificação
              </p>
              <p className="text-xs text-slate-400">
                As notificações serão exibidas aqui
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-6 w-6 text-[#1E1E2D]" />
        </Button>
      </div>
    </header>
  );
}
