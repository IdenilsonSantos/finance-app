"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import Link from "next/link";
import { Bell, Settings, LogOut, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, className, actions }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-gray-50/80 backdrop-blur-md border-b border-transparent",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {actions && (
            <div className="hidden md:flex items-center gap-3 mr-1">
              {actions}
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 data-[state=open]:bg-slate-100"
              >
                <Bell className="w-4 h-4" />
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

          <div className="h-6 w-px bg-slate-200 mx-0.5" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-1 pr-2 sm:pl-2 sm:pr-3 hover:bg-slate-100 rounded-full data-[state=open]:bg-slate-100"
              >
                <Avatar className="w-8 h-8 border border-slate-200">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback className="bg-[#1E1E2D] text-white text-xs font-bold">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block font-semibold text-sm text-slate-700">
                  {session?.user?.name?.split(" ")[0] || "Usuário"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="font-semibold text-slate-800 truncate">
                  {session?.user?.name || "Usuário"}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {session?.user?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/settings?tab=profile"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ redirectTo: "/sign-in" })}
                className="flex items-center gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex md:hidden items-center px-4 pb-3">{actions}</div>
      )}
    </header>
  );
}
