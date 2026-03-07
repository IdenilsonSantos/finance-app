"use client";

import { Header } from "@/components/Header";
import { useSession } from "next-auth/react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];
  const greeting = `${getGreeting()}${firstName ? `, ${firstName}` : ""}! Aqui está um resumo das suas finanças`;

  return (
    <div>
      <Header title="Dashboard" subtitle={greeting} />
      <div className="p-8">Em construção</div>
    </div>
  );
}
