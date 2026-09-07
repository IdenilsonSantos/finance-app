"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Target,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/providers/SidebarContext";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useNotificationsContext as useNotifications } from "@/components/providers/NotificationsContext";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";

const Sidebar = () => {
  const pathname = usePathname();
  const { collapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transações", icon: ReceiptText },
    { href: "/wallets", label: "Carteiras", icon: Wallet },
    { href: "/goals", label: "Metas", icon: Target },
    { href: "/notifications", label: "Notificações", icon: Bell, badge: unreadCount },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[59] md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out py-8 px-5 font-sans md:relative md:translate-x-0 shadow-xl md:shadow-none",
          collapsed ? "md:w-[90px]" : "md:w-[280px]",
          isMobileOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full w-[280px]",
        )}
      >
        <div className="absolute top-4 right-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 text-gray-400 hover:text-[#1E1E2D]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className={cn(
            "flex mb-10 transition-all duration-300",
            collapsed
              ? "flex-col items-center justify-center gap-4"
              : "flex-row items-center justify-between px-2",
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {collapsed && !isMobileOpen ? (
              <img
                src="https://res.cloudinary.com/djgvgwuwe/image/upload/v1788789010/logo_mini_zttgmf.png"
                alt="Logo"
                className="w-10 h-10 object-contain shrink-0 rounded-xl border border-gray-200"
              />
            ) : (
              <img
                src="https://res.cloudinary.com/djgvgwuwe/image/upload/v1788789010/logo_grande_rz2wy2.png"
                alt="Logo"
                className="h-10 w-auto object-contain shrink-0"
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "hidden md:flex text-gray-400 hover:text-[#1E1E2D] transition-all duration-200",
              !collapsed && "h-8 w-8 hover:bg-gray-100",
              collapsed &&
                "h-8 w-8 rounded-xl bg-gray-50 hover:bg-[#CFFF45] hover:text-[#1E1E2D] shadow-sm",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="mb-4">
          <WorkspaceSwitcher collapsed={collapsed && !isMobileOpen} />
        </div>

        <TooltipProvider delayDuration={200}>
          <nav className="flex flex-col gap-3 flex-1 overflow-y-auto md:overflow-visible no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const badge = "badge" in item ? item.badge : 0;
              const linkEl = (
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group text-[#8B8C9E] font-medium hover:text-[#1E1E2D]",
                    isActive
                      ? "bg-[#CFFF45] text-[#1E1E2D] font-bold shadow-sm"
                      : "hover:bg-gray-50",
                    collapsed && "md:justify-center md:px-0 md:hover:bg-gray-50",
                  )}
                >
                  <div className="relative shrink-0">
                    <item.icon
                      size={22}
                      className={cn(
                        "transition-colors",
                        isActive ? "text-[#1E1E2D] stroke-[2.5px]" : "stroke-[2px]",
                      )}
                    />
                    {!!badge && (collapsed && !isMobileOpen) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  {(!collapsed || isMobileOpen) && (
                    <span className="text-[15px] flex-1">{item.label}</span>
                  )}
                  {(!collapsed || isMobileOpen) && !!badge && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );

              if (collapsed && !isMobileOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={item.href}>{linkEl}</React.Fragment>;
            })}
          </nav>

          {isMobileOpen && (
            <div className="md:hidden border-t border-gray-100 pt-4 mt-2">
              <div className="flex items-center gap-3 px-2 py-2 rounded-2xl">
                <Avatar className="w-9 h-9 border border-slate-200 shrink-0">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback className="bg-[#1E1E2D] text-white text-xs font-bold">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {session?.user?.name || "Usuário"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 mt-auto flex flex-col gap-3 border-t border-gray-100">
            {collapsed && !isMobileOpen ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut({ redirectTo: "/sign-in" })}
                    className="flex items-center justify-center px-0 py-3.5 rounded-2xl transition-all duration-200 text-[#8B8C9E] font-medium hover:text-red-500 hover:bg-red-50 w-full cursor-pointer"
                  >
                    <LogOut size={22} className="shrink-0 stroke-[2px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => signOut({ redirectTo: "/sign-in" })}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 text-[#8B8C9E] font-medium hover:text-red-500 hover:bg-red-50 w-full text-left cursor-pointer"
              >
                <LogOut size={22} className="shrink-0 stroke-[2px]" />
                <span className="text-[15px]">Sair</span>
              </button>
            )}
          </div>
        </TooltipProvider>

      </aside>
    </>
  );
};

export default Sidebar;
