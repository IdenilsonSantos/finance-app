"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Shield,
  Building2,
  Bell,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Check,
  LogOut,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterTabs } from "@/components/ui/FilterTabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getInitials } from "@/lib/format";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

// ---- Tabs ----
const TABS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "notifications", label: "Notificações", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ---- Schemas ----
const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("Informe um e-mail válido"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve conter ao menos um número")
      .regex(/[^A-Za-z0-9]/, "Deve conter ao menos um caractere especial"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const workspaceSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
});

// ---- Section card ----
function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

// ---- Toggle ----
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer",
        checked ? "bg-[#1E1E2D]" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ---- Notif row ----
function NotifRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ================================================================
// PERFIL
// ================================================================
function ProfileSection() {
  const { data: session, update } = useSession();
  const initialized = useRef(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: session?.user?.name ?? "", email: session?.user?.email ?? "" },
  });

  useEffect(() => {
    if (session?.user && !initialized.current) {
      form.reset({ name: session.user.name ?? "", email: session.user.email ?? "" });
      initialized.current = true;
    }
  }, [session?.user?.name, session?.user?.email, form]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    try {
      await api.patch("/users/me", { name: values.name, email: values.email });
      await update({ name: values.name, email: values.email });
      form.reset(values);
      toast.success("Perfil atualizado");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Informações Pessoais" description="Seus dados de exibição na plataforma">
        <div className="flex items-center gap-4 py-1">
          <Avatar className="w-14 h-14 border-2 border-slate-100 shrink-0">
            <AvatarFallback className="bg-[#1E1E2D] text-white text-base font-bold">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-slate-900">{session?.user?.name || "Usuário"}</p>
            <p className="text-xs text-slate-400 mt-0.5">{session?.user?.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1E1E2D] text-white hover:bg-slate-800 rounded-2xl h-11 font-semibold gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Salvar Perfil
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SectionCard>

      <SectionCard title="Sessão" description="Gerencie seu acesso à plataforma">
        <button
          onClick={() => signOut({ redirectTo: "/sign-in" })}
          className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-2xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </SectionCard>
    </div>
  );
}

// ================================================================
// SEGURANÇA
// ================================================================
function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      await api.patch("/users/me", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Senha alterada com sucesso");
      form.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("incorreta") || msg.toLowerCase().includes("unauthorized")) {
        toast.error("Senha atual incorreta");
      } else {
        toast.error("Não foi possível alterar a senha");
      }
    }
  }

  return (
    <SectionCard title="Alterar Senha" description="Mantenha sua conta protegida com uma senha forte">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha atual</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isSubmitting}
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => {
              const val = field.value ?? "";
              const checks = [
                { ok: val.length >= 8, label: "8+ caracteres" },
                { ok: /[A-Z]/.test(val), label: "Maiúscula" },
                { ok: /[0-9]/.test(val), label: "Número" },
                { ok: /[^A-Za-z0-9]/.test(val), label: "Especial" },
              ];
              const strength = checks.filter((c) => c.ok).length;
              return (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        disabled={isSubmitting}
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  {val.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              i <= strength
                                ? strength <= 1 ? "bg-red-400"
                                  : strength === 2 ? "bg-amber-400"
                                  : strength === 3 ? "bg-yellow-400"
                                  : "bg-emerald-500"
                                : "bg-slate-100",
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {checks.map((c) => (
                          <span
                            key={c.label}
                            className={cn(
                              "text-[10px] font-semibold flex items-center gap-1",
                              c.ok ? "text-emerald-600" : "text-slate-400",
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", c.ok ? "bg-emerald-500" : "bg-slate-300")} />
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar nova senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repita a nova senha"
                      disabled={isSubmitting}
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1E1E2D] text-white hover:bg-slate-800 rounded-2xl h-11 font-semibold gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Alterar Senha
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </SectionCard>
  );
}

// ================================================================
// WORKSPACE
// ================================================================
function CreateWorkspaceInline({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Nome do workspace"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        autoFocus
        className="flex-1 h-10 text-sm rounded-2xl"
      />
      <Button
        type="submit"
        disabled={loading || !name.trim()}
        className="h-10 px-4 rounded-2xl bg-[#1E1E2D] text-white hover:bg-slate-800 text-sm font-semibold"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 px-3 rounded-2xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
      >
        Cancelar
      </button>
    </form>
  );
}

function WorkspaceSection() {
  const { workspaces, loading, currentWorkspaceId, switchWorkspace, createWorkspace, deleteWorkspace, refetch } =
    useWorkspaces();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (currentWorkspace) form.reset({ name: currentWorkspace.name });
  }, [currentWorkspace?.name, form]);

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof workspaceSchema>) {
    if (!currentWorkspaceId) return;
    try {
      await api.patch(`/workspaces/${currentWorkspaceId}`, { name: values.name });
      refetch();
      toast.success("Workspace atualizado");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar workspace");
    }
  }

  async function handleCreate(name: string) {
    try {
      await createWorkspace(name);
      toast.success("Workspace criado");
      setCreating(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar workspace");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteWorkspace(id);
      toast.success("Workspace excluído");
      setConfirmDeleteId(null);
      if (id === currentWorkspaceId && workspaces.length > 1) {
        const next = workspaces.find((w) => w.id !== id);
        if (next) await switchWorkspace(next.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir workspace");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Workspace Atual" description="Configurações do seu espaço de trabalho">
        {loading ? (
          <div className="h-16 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do workspace</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Finanças Pessoais"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentWorkspace?.slug && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <Input
                    value={currentWorkspace.slug}
                    disabled
                    className="bg-slate-50 text-slate-400 cursor-not-allowed font-mono text-sm"
                  />
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#1E1E2D] text-white hover:bg-slate-800 rounded-2xl h-11 font-semibold gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvar Workspace
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SectionCard>

      <SectionCard title="Meus Workspaces" description="Alterne ou crie novos espaços de trabalho">
        <ScrollArea className={workspaces.length > 3 ? "h-[168px]" : undefined}>
          <div className={cn("space-y-1", workspaces.length > 3 && "pr-3")}>
            {workspaces.map((ws) => {
              const isActive = ws.id === currentWorkspaceId;
              return (
                <div
                  key={ws.id}
                  className={cn(
                    "group flex items-center justify-between gap-3 px-3 py-3 rounded-2xl transition-colors",
                    isActive ? "bg-[#1E1E2D]" : "hover:bg-slate-50",
                  )}
                >
                  <button
                    disabled={isActive || switchingId === ws.id}
                    onClick={async () => {
                      if (isActive) return;
                      setSwitchingId(ws.id);
                      try {
                        await switchWorkspace(ws.id);
                        router.refresh();
                        toast.success(`Workspace alterado para ${ws.name}`);
                      } finally {
                        setSwitchingId(null);
                      }
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                        isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {ws.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isActive ? "text-white" : "text-slate-800")}>
                        {ws.name}
                      </p>
                      <p className={cn("text-xs truncate font-mono", isActive ? "text-white/50" : "text-slate-400")}>
                        {ws.slug}
                      </p>
                    </div>
                  </button>

                  {switchingId === ws.id ? (
                    <Loader2 className="w-4 h-4 text-slate-400 shrink-0 animate-spin" />
                  ) : isActive ? (
                    <Check className="w-4 h-4 text-white shrink-0" />
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(ws.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {creating ? (
          <CreateWorkspaceInline onCancel={() => setCreating(false)} onCreate={handleCreate} />
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-sm font-semibold text-slate-400">Novo workspace</span>
          </button>
        )}
      </SectionCard>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Excluir workspace"
        description={`O workspace "${workspaces.find((w) => w.id === confirmDeleteId)?.name}" e todos os seus dados serão removidos permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        loading={deletingId !== null}
      />
    </div>
  );
}

// ================================================================
// NOTIFICAÇÕES
// ================================================================
const NOTIF_KEY = "finance_notif_prefs";

type NotifPrefs = {
  goalDeadline: boolean;
  goalAchieved: boolean;
  scheduledReminder: boolean;
  monthlySummary: boolean;
  lowBalance: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  goalDeadline: true,
  goalAchieved: true,
  scheduledReminder: true,
  monthlySummary: false,
  lowBalance: false,
};

function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
  }, []);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  function handleSave() {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
      setSaved(true);
      toast.success("Preferências salvas");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Erro ao salvar preferências");
    }
  }

  return (
    <SectionCard title="Preferências de Notificação" description="Controle quais alertas você deseja receber">
      <NotifRow
        label="Prazo de metas"
        description="Avise quando uma meta estiver próxima do vencimento"
        checked={prefs.goalDeadline}
        onChange={() => toggle("goalDeadline")}
      />
      <NotifRow
        label="Meta alcançada"
        description="Comemore quando atingir 100% de uma meta"
        checked={prefs.goalAchieved}
        onChange={() => toggle("goalAchieved")}
      />
      <NotifRow
        label="Lembretes de agendamento"
        description="Notifique sobre transações agendadas próximas"
        checked={prefs.scheduledReminder}
        onChange={() => toggle("scheduledReminder")}
      />
      <NotifRow
        label="Resumo mensal"
        description="Receba um resumo das suas finanças todo mês"
        checked={prefs.monthlySummary}
        onChange={() => toggle("monthlySummary")}
      />
      <NotifRow
        label="Saldo baixo"
        description="Alerte quando o saldo de uma conta estiver crítico"
        checked={prefs.lowBalance}
        onChange={() => toggle("lowBalance")}
      />

      <div className="pt-2">
        <Button
          onClick={handleSave}
          className={cn(
            "rounded-2xl h-11 font-semibold gap-2 transition-all",
            saved
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-[#1E1E2D] text-white hover:bg-slate-800",
          )}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Salvo!
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              Salvar Preferências
            </>
          )}
        </Button>
      </div>
    </SectionCard>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header title="Configurações" subtitle="Gerencie sua conta e preferências" />

      <div className="flex-1 p-4 md:p-8 space-y-6">
        {/* Tab nav */}
        <div className="bg-white rounded-3xl shadow-sm px-6 py-4">
          <FilterTabs tabs={TABS} value={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        </div>

        {/* Content */}
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "security" && <SecuritySection />}
        {activeTab === "workspace" && <WorkspaceSection />}
        {activeTab === "notifications" && <NotificationsSection />}
      </div>
    </div>
  );
}
