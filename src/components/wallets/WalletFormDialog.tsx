"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Trash2, Landmark } from "lucide-react";
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
import { ACCOUNT_TYPE_META } from "@/lib/accounts";

const ACCOUNT_TYPES = Object.entries(ACCOUNT_TYPE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
  Icon: meta.icon,
}));

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

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

const createSchema = z
  .object({
    name: z.string().min(1, "Informe o nome da conta"),
    type: z.string().min(1, "Selecione o tipo"),
    color: z.string().min(1, "Selecione uma cor"),
    // Pode ser negativo (ex.: conta no cheque especial). No cartão de crédito
    // é o valor já utilizado do limite (positivo).
    balance: z
      .string()
      .min(1, "Informe o saldo")
      .refine((v) => !isNaN(parseFloat(v)), "Saldo inválido"),
    creditLimit: z.string().optional(),
    closingDay: z.string().optional(),
    dueDay: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type !== "credit_card") return;
    if (!v.closingDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o fechamento", path: ["closingDay"] });
    }
    if (!v.dueDay) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o vencimento", path: ["dueDay"] });
    }
    if (parseFloat(v.balance) < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe um valor positivo", path: ["balance"] });
    }
  });

// Na edição o saldo também é editável: a diferença vira um lançamento de
// "Ajuste de saldo", como nos apps de finanças (não conta como receita/despesa).
const editSchema = createSchema;

type CreateValues = z.infer<typeof createSchema>;
type EditValues = CreateValues;

interface WalletFormProps {
  wallet?: BankAccountResponse | null;
  onCreate: (data: CreateWalletPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateWalletPayload) => Promise<void>;
  onAdjustBalance?: (id: string, balanceInCents: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

function WalletForm({ wallet, onCreate, onUpdate, onAdjustBalance, onDelete, onClose }: WalletFormProps) {
  const isEdit = !!wallet;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: wallet
      ? {
          name: wallet.name,
          type: wallet.type,
          color: wallet.color,
          // Cartão: o saldo (negativo) é exibido como valor utilizado (positivo).
          balance: ((wallet.type === "credit_card" ? -wallet.balance : wallet.balance) / 100).toFixed(2),
          creditLimit: wallet.creditLimit !== null ? (wallet.creditLimit / 100).toFixed(2) : "",
          closingDay: wallet.closingDay ? String(wallet.closingDay) : "",
          dueDay: wallet.dueDay ? String(wallet.dueDay) : "",
        }
      : {
          name: "",
          type: "checking",
          color: PRESET_COLORS[0],
          balance: "",
          creditLimit: "",
          closingDay: "",
          dueDay: "",
        },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedColor = form.watch("color");
  const isCard = form.watch("type") === "credit_card";

  function cardPayload(values: CreateValues) {
    if (values.type !== "credit_card") return {};
    return {
      creditLimit: values.creditLimit ? Math.round(parseFloat(values.creditLimit) * 100) : null,
      closingDay: Number(values.closingDay),
      dueDay: Number(values.dueDay),
    };
  }

  /** Converte o valor digitado para o saldo da conta (cartão = dívida, negativo). */
  function toBalanceInCents(values: CreateValues) {
    const cents = Math.round(parseFloat(values.balance) * 100);
    return values.type === "credit_card" ? -cents : cents;
  }

  async function onSubmit(values: CreateValues | EditValues) {
    try {
      if (isEdit && wallet) {
        await onUpdate(wallet.id, {
          name: values.name,
          type: values.type,
          color: values.color,
          ...cardPayload(values),
        });
        const newBalance = toBalanceInCents(values);
        if (onAdjustBalance && newBalance !== wallet.balance) {
          await onAdjustBalance(wallet.id, newBalance);
          toast.success("Conta atualizada e saldo ajustado");
        } else {
          toast.success("Conta atualizada");
        }
      } else {
        const v = values as CreateValues;
        await onCreate({
          name: v.name,
          type: v.type,
          color: v.color,
          initialBalance: toBalanceInCents(v),
          ...cardPayload(v),
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

        {(!isEdit || onAdjustBalance) && (
          <FormField
            control={form.control as ReturnType<typeof useForm<CreateValues>>["control"]}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isCard ? "Valor utilizado do limite" : isEdit ? "Saldo atual" : "Saldo inicial"}
                </FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="0,00"
                    allowNegative={!isCard}
                    disabled={isSubmitting}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <p className="text-[11px] text-slate-400">
                  {isCard
                    ? "Soma das faturas em aberto e compras parceladas ainda não pagas."
                    : isEdit
                      ? "Alterar o saldo cria um lançamento de ajuste, sem afetar receitas e despesas."
                      : "Digite \"-\" para saldo negativo (ex.: cheque especial)."}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isCard && (
          <div className="space-y-4 rounded-2xl border border-slate-100 p-4">
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Limite <span className="text-slate-400 font-normal">(opcional)</span>
                  </FormLabel>
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
            <div className="grid grid-cols-2 gap-3">
              {(["closingDay", "dueDay"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{name === "closingDay" ? "Fecha no dia" : "Vence no dia"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Dia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAY_OPTIONS.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Compras feitas a partir do dia do fechamento entram na fatura seguinte. Pague a fatura
              com uma transferência de outra conta para o cartão.
            </p>
          </div>
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
              description="Essa ação não pode ser desfeita. A conta, suas transações e transferências serão removidas permanentemente. Para manter o histórico, prefira arquivar a conta."
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
  onAdjustBalance?: (id: string, balanceInCents: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function WalletFormDialog({
  open,
  onOpenChange,
  wallet,
  onCreate,
  onUpdate,
  onAdjustBalance,
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
          onAdjustBalance={onAdjustBalance}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
