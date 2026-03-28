"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api/client";
import { WorkspaceInviteInfoResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  LogIn,
  Building2,
  Mail,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Membro",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {value && <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>}
        {badge}
      </div>
    </div>
  );
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { status } = useSession();
  const router = useRouter();

  const [invite, setInvite] = useState<WorkspaceInviteInfoResponse | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<WorkspaceInviteInfoResponse>(`/workspaces/invites/${token}`);
        setInvite(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Convite inválido ou expirado");
      } finally {
        setLoadingInvite(false);
      }
    }
    load();
  }, [token]);

  async function handleAccept() {
    if (status !== "authenticated") {
      router.push(`/sign-in?callbackUrl=/invites/${token}`);
      return;
    }
    setAccepting(true);
    try {
      await api.post(`/workspaces/invites/${token}/accept`, {});
      setAccepted(true);
      toast.success(`Você entrou no workspace ${invite?.workspaceName}!`);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Brand */}
          <div className="mb-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1E1E2D] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Finance App</span>
          </div>

          {loadingInvite ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : error ? (
            <div className="flex flex-col gap-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Convite inválido</h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{error}</p>
              </div>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E1E2D] hover:underline"
              >
                Ir para o login
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : accepted ? (
            <div className="flex flex-col gap-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Tudo certo!</h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Você entrou em{" "}
                  <span className="font-semibold text-slate-700">{invite?.workspaceName}</span>.
                  <br />
                  Redirecionando para o dashboard...
                </p>
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Workspace heading */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  Você foi convidado para
                </p>
                <h1 className="text-2xl font-bold text-slate-900">{invite?.workspaceName}</h1>
              </div>

              {/* Details */}
              <div className="rounded-2xl border border-slate-100 px-4 divide-y divide-slate-100">
                <InfoRow icon={User} label="Convidado por" value={invite?.inviterName} />
                <InfoRow icon={Mail} label="Para o email" value={invite?.invitedEmail} />
                <InfoRow
                  icon={Users}
                  label="Sua função"
                  badge={
                    <span
                      className={cn(
                        "inline-flex items-center mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                        ROLE_COLORS[invite?.role ?? "member"],
                      )}
                    >
                      {ROLE_LABELS[invite?.role ?? "member"]}
                    </span>
                  }
                />
                <InfoRow
                  icon={Clock}
                  label="Convite válido até"
                  value={
                    invite?.expiresAt
                      ? format(new Date(invite.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "—"
                  }
                />
              </div>

              {/* CTA */}
              <div className="space-y-3">
                {status === "loading" ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : status === "unauthenticated" ? (
                  <>
                    <Button
                      onClick={handleAccept}
                      className="w-full h-11 rounded-xl bg-[#1E1E2D] text-white hover:bg-slate-800 font-semibold gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Fazer login para aceitar
                    </Button>
                    <p className="text-[11px] text-slate-400 text-center">
                      Você será redirecionado de volta após o login
                    </p>
                  </>
                ) : (
                  <Button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full h-11 rounded-xl bg-[#1E1E2D] text-white hover:bg-slate-800 font-semibold gap-2"
                  >
                    {accepting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    {accepting ? "Aceitando..." : "Aceitar convite"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — decorative (same as sign-in) */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-200 to-gray-100 flex items-center justify-center">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#EADFD8] to-transparent rounded-t-[100px] scale-150 translate-y-20 opacity-60" />
            <div className="relative z-10 flex flex-col items-center justify-center text-gray-400">
              <div className="w-48 h-48 rounded-full bg-[#dbf249] flex items-center justify-center mb-4 shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
