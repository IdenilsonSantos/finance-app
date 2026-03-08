"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Trash2, QrCode, CreditCard, Wallet, Banknote, ArrowLeftRight, Barcode, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_STYLES } from "@/lib/categories";
import { TransactionResponse, BankAccountResponse } from "@/types/api";
import {
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Module-level constants — never recreated on render
const schema = z.object({
  bankAccountId: z.string().min(1, "Selecione uma conta"),
  amount: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor deve ser positivo"),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  beneficiary: z.string().optional(),
  category: z.string().min(1, "Selecione uma categoria"),
  paymentMethod: z.string().optional(),
  date: z.string().min(1, "Informe a data"),
});

const resolver = zodResolver(schema);

const CATEGORIES = Object.entries(CATEGORY_STYLES)
  .filter(([key]) => key !== "outros")
  .map(([key, style]) => ({
    key,
    label: style.label,
    color: style.color,
    Icon: style.icon,
  }));

const PAYMENT_METHODS: { value: string; label: string; Icon: LucideIcon; color: string }[] = [
  { value: "pix",         label: "Pix",              Icon: QrCode,         color: "#00966B" },
  { value: "credit_card", label: "Cartão de Crédito", Icon: CreditCard,     color: "#4580FF" },
  { value: "debit_card",  label: "Cartão de Débito",  Icon: Wallet,         color: "#9945FF" },
  { value: "cash",        label: "Dinheiro",          Icon: Banknote,       color: "#8FB800" },
  { value: "transfer",    label: "Transferência",     Icon: ArrowLeftRight, color: "#E06A20" },
  { value: "boleto",      label: "Boleto",            Icon: Barcode,        color: "#0090BF" },
];

type FormValues = z.infer<typeof schema>;

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionResponse | null;
  bankAccounts: BankAccountResponse[];
  onCreate: (data: CreateTransactionPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateTransactionPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface TransactionFormProps {
  transaction?: TransactionResponse | null;
  bankAccounts: BankAccountResponse[];
  onCreate: (data: CreateTransactionPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateTransactionPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

function TransactionForm({
  transaction,
  bankAccounts,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: TransactionFormProps) {
  const isEdit = !!transaction;

  const form = useForm<FormValues>({
    resolver,
    defaultValues: transaction
      ? {
          bankAccountId: transaction.bankAccountId,
          amount: (transaction.amount / 100).toFixed(2),
          type: transaction.type,
          description: transaction.description ?? "",
          beneficiary: transaction.beneficiary ?? "",
          category: transaction.category,
          paymentMethod: transaction.paymentMethod ?? "",
          date: transaction.date,
        }
      : {
          bankAccountId: bankAccounts[0]?.id ?? "",
          amount: "",
          type: "expense",
          description: "",
          beneficiary: "",
          category: "",
          paymentMethod: "",
          date: new Date().toISOString().slice(0, 10),
        },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isSubmitting = form.formState.isSubmitting;
  const currentType = form.watch("type");

  async function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    try {
      if (isEdit && transaction) {
        await onUpdate(transaction.id, {
          bankAccountId: values.bankAccountId,
          amount,
          type: values.type,
          description: values.description || null,
          beneficiary: values.beneficiary || null,
          category: values.category,
          paymentMethod: values.paymentMethod || null,
          date: values.date,
        });
        toast.success("Transação atualizada");
      } else {
        await onCreate({
          bankAccountId: values.bankAccountId,
          amount,
          type: values.type,
          description: values.description || undefined,
          beneficiary: values.beneficiary || undefined,
          category: values.category,
          paymentMethod: values.paymentMethod || undefined,
          date: values.date,
        });
        toast.success("Transação criada");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar transação");
    }
  }

  async function handleDelete() {
    if (!transaction || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      toast.success("Transação excluída");
      setConfirmOpen(false);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir transação");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type toggle */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => field.onChange("income")}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    field.value === "income"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("expense")}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    field.value === "expense"
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  Despesa
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor + Data */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Conta Bancária */}
        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Bancária</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isSubmitting}>
                    <SelectValue placeholder="Selecione a conta de origem/destino" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <span className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 shrink-0" style={{ color: account.color }} />
                        {account.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder={currentType === "income" ? "Ex: salário, freela..." : "Ex: energia, netflix..."}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Beneficiário */}
        <FormField
          control={form.control}
          name="beneficiary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beneficiário / Destinatário</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Supermercado X"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria + Pagamento */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isSubmitting}>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map(({ key, label, color, Icon }) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isSubmitting}>
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_METHODS.map(({ value, label, Icon, color }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Save */}
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
              {isEdit ? "Salvar Alterações" : "Criar Transação"}
            </>
          )}
        </Button>

        {/* Delete (edit only) */}
        {isEdit && onDelete && (
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir transação
            </button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Excluir transação"
              description="Essa ação não pode ser desfeita. A transação será removida permanentemente"
              onConfirm={handleDelete}
              loading={isDeleting}
            />
          </>
        )}
      </form>
    </Form>
  );
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  bankAccounts,
  onCreate,
  onUpdate,
  onDelete,
}: TransactionFormDialogProps) {
  const isEdit = !!transaction;
  const typeLabel = isEdit
    ? transaction.type === "income"
      ? "Receita"
      : "Despesa"
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar ${typeLabel}` : "Nova Transação"}
          </DialogTitle>
          <p className="text-sm text-slate-400">
            {isEdit
              ? "Atualize os detalhes do seu lançamento"
              : "Registre um novo lançamento financeiro"}
          </p>
        </DialogHeader>
        <TransactionForm
          key={transaction?.id ?? "new"}
          transaction={transaction}
          bankAccounts={bankAccounts}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
