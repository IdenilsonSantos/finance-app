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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import Link from "next/link";
import { Bell, Settings, LogOut, User, CheckCheck, Trophy, Clock, CalendarCheck, ArrowLeftRight, LucideIcon } from "lucide-react";
import { useNotificationsContext as useNotifications } from "@/components/providers/NotificationsContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  goalAchieved: Trophy,
  goalDeadline: Clock,
  scheduledReminder: CalendarCheck,
  transferCreated: ArrowLeftRight,
};

export function Header({ title, subtitle, className, actions }: HeaderProps) {
  const { data: session } = useSession();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-gray-50/80 backdrop-blur-md border-b border-transparent",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5">
          {actions && (
            <div className="hidden md:flex items-center gap-3 mr-1">{actions}</div>
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-900">Notificações</span>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar tudo
                      </button>
                    )}
                    <Link
                      href="/notifications"
                      className="text-xs text-[#8B8C9E] hover:text-[#1E1E2D] transition-colors"
                    >
                      Ver todas
                    </Link>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <Bell className="w-8 h-8 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500">Nenhuma notificação</p>
                    <p className="text-xs text-slate-400">As notificações serão exibidas aqui</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="p-2 space-y-0.5">
                      {recentNotifications.map((n) => {
                        const Icon = TYPE_ICONS[n.type] ?? Bell;
                        return (
                          <button
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all",
                              !n.read
                                ? "bg-slate-50 hover:bg-slate-100/70"
                                : "hover:bg-slate-50 opacity-60",
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                              !n.read ? "bg-white text-slate-600" : "bg-slate-100 text-slate-500",
                            )}>
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn(
                                "text-sm font-semibold line-clamp-2 leading-snug",
                                !n.read ? "text-slate-900" : "text-slate-700",
                              )}>
                                {n.title}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
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
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4 text-slate-400" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
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
