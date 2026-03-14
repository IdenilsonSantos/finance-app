"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Trash2, Building2, PiggyBank, Landmark, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BankAccountResponse } from "@/types/api";
import { CreateWalletPayload, UpdateWalletPayload } from "@/hooks/useWallets";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "checking",   label: "C. Corrente",  Icon: Landmark   },
  { value: "savings",    label: "Poupança",      Icon: PiggyBank  },
  { value: "investment", label: "Investimento",  Icon: Building2  },
  { value: "cash",       label: "Dinheiro",      Icon: CreditCard },
];

const PRESET_COLORS = [
  "#22c55e",
  "#f97316",
  "#eab308",
  "#a855f7",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#1E1E2D",
  "#64748b",
];

const createSchema = z.object({
  name: z.string().min(1, "Informe o nome da conta"),
  type: z.string().min(1, "Selecione o tipo"),
  color: z.string().min(1, "Selecione uma cor"),
  balance: z
    .string()
    .min(1, "Informe o saldo inicial")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Saldo inválido"),
});

const editSchema = z.object({
  name: z.string().min(1, "Informe o nome da conta"),
  type: z.string().min(1, "Selecione o tipo"),
  color: z.string().min(1, "Selecione uma cor"),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface WalletFormProps {
  wallet?: BankAccountResponse | null;
  onCreate: (data: CreateWalletPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateWalletPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

function WalletForm({ wallet, onCreate, onUpdate, onDelete, onClose }: WalletFormProps) {
  const isEdit = !!wallet;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: wallet
      ? { name: wallet.name, type: wallet.type, color: wallet.color }
      : { name: "", type: "checking", color: PRESET_COLORS[0], balance: "" },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedColor = form.watch("color");

  async function onSubmit(values: CreateValues | EditValues) {
    try {
      if (isEdit && wallet) {
        await onUpdate(wallet.id, {
          name: values.name,
          type: values.type,
          color: values.color,
        });
        toast.success("Conta atualizada");
      } else {
        const v = values as CreateValues;
        await onCreate({
          name: v.name,
          type: v.type,
          color: v.color,
          initialBalance: Math.round(parseFloat(v.balance) * 100),
        });
        toast.success("Conta criada");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar conta");
    }
  }

  async function handleDelete() {
    if (!wallet || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(wallet.id);
      toast.success("Conta excluída");
      setConfirmOpen(false);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir conta");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
          <div
            className="w-10 h-10 rounded-xl shrink-0 transition-colors flex items-center justify-center text-white"
            style={{ backgroundColor: selectedColor }}
          >
            {(() => {
              const Icon = ACCOUNT_TYPES.find((t) => t.value === form.watch("type"))?.Icon ?? Landmark;
              return <Icon className="w-5 h-5" />;
            })()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {form.watch("name") || "Nome da conta"}
            </p>
            <p className="text-xs text-slate-400">
              {ACCOUNT_TYPES.find((t) => t.value === form.watch("type"))?.label ?? "Tipo"}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nubank, Banco Inter..." disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.Icon className="w-4 h-4 shrink-0" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEdit && (
          <FormField
            control={form.control as ReturnType<typeof useForm<CreateValues>>["control"]}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo inicial</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="0,00"
                    disabled={isSubmitting}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "w-6 h-6 rounded-lg transition-all border-2",
                        field.value === color
                          ? "border-slate-900 scale-110 shadow-md"
                          : "border-transparent hover:scale-105",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl h-12 bg-[#1E1E2D] text-white hover:bg-slate-800 font-semibold gap-2 mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              {isEdit ? "Salvar Alterações" : "Criar Conta"}
            </>
          )}
        </Button>

        {isEdit && onDelete && (
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir conta
            </button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Excluir conta"
              description="Essa ação não pode ser desfeita. A conta e todas as suas transações serão removidas permanentemente."
              onConfirm={handleDelete}
              loading={isDeleting}
            />
          </>
        )}
      </form>
    </Form>
  );
}

interface WalletFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: BankAccountResponse | null;
  onCreate: (data: CreateWalletPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateWalletPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function WalletFormDialog({
  open,
  onOpenChange,
  wallet,
  onCreate,
  onUpdate,
  onDelete,
}: WalletFormDialogProps) {
  const isEdit = !!wallet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          <p className="text-sm text-slate-400">
            {isEdit
              ? "Atualize os detalhes da sua conta"
              : "Adicione uma nova conta ou carteira"}
          </p>
        </DialogHeader>
        <WalletForm
          key={wallet?.id ?? "new"}
          wallet={wallet}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
