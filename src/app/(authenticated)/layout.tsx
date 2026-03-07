import { SidebarProvider } from "@/components/providers/SidebarContext";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
