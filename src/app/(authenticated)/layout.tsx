"use client";

import { useSession } from "next-auth/react";
import { SidebarProvider } from "@/components/providers/SidebarContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { Building2, Loader2 } from "lucide-react";

function NoWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#1E1E2D] flex items-center justify-center">
        <Building2 className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Nenhum workspace encontrado</h2>
      <p className="text-sm text-slate-500 max-w-xs">
        Sua conta não está vinculada a nenhum workspace. Tente fazer login novamente.
      </p>
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading" && !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (status !== "loading" && !session?.workspaceId) {
    return <NoWorkspace />;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen bg-gray-50 text-gray-900 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <MobileHeader />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
