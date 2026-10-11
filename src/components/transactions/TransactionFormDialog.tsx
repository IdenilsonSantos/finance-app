"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Trash2, QrCode, CreditCard, Wallet, Banknote, ArrowLeftRight, Barcode, Landmark, CalendarClock, Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { categorySelectOptions } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { getAccountTypeMeta, isCreditCard } from "@/lib/accounts";
import { formatCurrency } from "@/lib/format";
import { TransactionResponse, BankAccountResponse } from "@/types/api";
import {
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "@/hooks/useTransactions";
import { CreateScheduledTransactionPayload } from "@/hooks/useScheduledTransactions";
import { WalletFormDialog } from "@/components/wallets/WalletFormDialog";
import { CreateWalletPayload, UpdateWalletPayload } from "@/hooks/useWallets";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const FREQUENCIES = [
  { value: "once",    label: "Uma vez" },
  { value: "daily",   label: "Diário" },
  { value: "weekly",  label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly",  label: "Anual" },
] as const;

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
  frequency: z.enum(["once", "daily", "weekly", "monthly", "yearly"]).optional(),
  endDate: z.string().optional(),
  installments: z.string().optional(),
  pending: z.boolean().optional(),
});

const INSTALLMENT_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1);

const resolver = zodResolver(schema);

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
  onDelete?: (id: string, scope?: "single" | "installments") => Promise<void>;
  onCreateScheduled?: (data: CreateScheduledTransactionPayload) => Promise<void>;
  onConvertToTransfer?: (id: string, counterpartAccountId?: string) => Promise<void>;
}

interface TransactionFormProps {
  transaction?: TransactionResponse | null;
  bankAccounts: BankAccountResponse[];
  onCreate: (data: CreateTransactionPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateTransactionPayload) => Promise<void>;
  onDelete?: (id: string, scope?: "single" | "installments") => Promise<void>;
  onCreateScheduled?: (data: CreateScheduledTransactionPayload) => Promise<void>;
  onConvertToTransfer?: (id: string, counterpartAccountId?: string) => Promise<void>;
  onClose: () => void;
}

function TransactionForm({
  transaction,
  bankAccounts,
  onCreate,
  onUpdate,
  onDelete,
  onCreateScheduled,
  onConvertToTransfer,
  onClose,
}: TransactionFormProps) {
  const isEdit = !!transaction;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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
          pending: transaction.status === "pending",
        }
      : {
          bankAccountId: bankAccounts.find((a) => !a.archivedAt)?.id ?? "",
          amount: "",
          type: "expense",
          description: "",
          beneficiary: "",
          category: "",
          paymentMethod: "",
          // Data local: toISOString() usaria UTC e viraria "amanhã" depois das 21h.
          date: today,
          frequency: "monthly",
          installments: "1",
          pending: false,
        },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"single" | "installments">("single");
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<string>("__linked__");
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [extraAccounts, setExtraAccounts] = useState<BankAccountResponse[]>([]);
  // Contas arquivadas não recebem lançamentos (exceto a já usada na edição).
  const allAccounts = [
    ...bankAccounts,
    ...extraAccounts.filter((e) => !bankAccounts.some((b) => b.id === e.id)),
  ].filter((a) => !a.archivedAt || a.id === transaction?.bankAccountId);
  const isInstallment = !!transaction?.installmentGroupId && (transaction.installmentTotal ?? 0) > 1;
  const isSubmitting = form.formState.isSubmitting;
  const currentType = form.watch("type");
  // Recarrega as opções quando as categorias personalizadas chegam.
  useCategories();
  const currentDate = form.watch("date");
  const currentFrequency = form.watch("frequency");
  // Conta pendente ("a pagar/receber") não vira agendamento, mesmo com data futura:
  // fica aguardando a confirmação do pagamento.
  const isPending = !!form.watch("pending");
  const isScheduled =
    !isEdit && !isPending && !!onCreateScheduled && !!currentDate && currentDate > today;
  const isRecurring = isScheduled && currentFrequency && currentFrequency !== "once";
  const selectedAccount = allAccounts.find((a) => a.id === form.watch("bankAccountId"));
  // Parcelamento: só despesas no cartão de crédito (como nos bancos).
  const selectedIsCard = isCreditCard(selectedAccount);
  const canInstall = !isEdit && !isScheduled && currentType === "expense" && selectedIsCard;
  // Cartão não tem pendente: a compra já entra na fatura.
  const status = !selectedIsCard && isPending ? "pending" : "paid";
  const currentAmount = parseFloat(form.watch("amount") || "0") || 0;

  async function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    const freq = values.frequency ?? "monthly";
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isFutureDate = !!values.date && values.date > todayStr;
    const shouldSchedule = !isEdit && !!onCreateScheduled && isFutureDate;
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
          status,
        });
        toast.success("Transação atualizada");
      } else if (shouldSchedule && onCreateScheduled) {
        await onCreateScheduled({
          bankAccountId: values.bankAccountId,
          amount,
          type: values.type,
          description: values.description || undefined,
          category: values.category,
          frequency: freq as "once" | "daily" | "weekly" | "monthly" | "yearly",
          nextDate: values.date,
          endDate: values.endDate || undefined,
        });
        toast.success("Agendamento criado");
      } else {
        const installments = canInstall ? Number(values.installments ?? "1") : 1;
        await onCreate({
          bankAccountId: values.bankAccountId,
          amount,
          type: values.type,
          description: values.description || undefined,
          beneficiary: values.beneficiary || undefined,
          category: values.category,
          paymentMethod: values.paymentMethod || undefined,
          date: values.date,
          status,
          ...(installments > 1 ? { installments } : {}),
        });
        toast.success(installments > 1 ? `Compra parcelada em ${installments}x` : "Transação criada");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  // Converter em transferência: só lançamentos já efetivados, fora de cartão,
  // ajustes e parcelamentos (as mesmas regras da API).
  const transactionAccount = transaction
    ? allAccounts.find((a) => a.id === transaction.bankAccountId)
    : undefined;
  const linkedInvestment = transaction
    ? bankAccounts.find((a) => a.linkedAccountId === transaction.bankAccountId && !a.archivedAt)
    : undefined;
  const convertOptions = transaction
    ? bankAccounts.filter(
        (a) =>
          a.id !== transaction.bankAccountId &&
          a.id !== linkedInvestment?.id &&
          // Cartão como destino = pagamento de fatura lançado como despesa.
          !a.archivedAt,
      )
    : [];
  const canConvert =
    !!onConvertToTransfer &&
    !!transaction &&
    transaction.status === "paid" &&
    transaction.category !== "adjustment" &&
    !transaction.installmentGroupId &&
    !isCreditCard(transactionAccount);

  async function handleConvert() {
    if (!transaction || !onConvertToTransfer) return;
    setIsConverting(true);
    try {
      await onConvertToTransfer(
        transaction.id,
        convertTarget === "__linked__" ? undefined : convertTarget,
      );
      toast.success("Convertida em transferência");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao converter");
    } finally {
      setIsConverting(false);
    }
  }

  async function handleDelete() {
    if (!transaction || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(transaction.id, deleteScope);
      toast.success(deleteScope === "installments" ? "Compra parcelada excluída" : "Transação excluída");
      setConfirmOpen(false);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir transação");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
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

        {isScheduled && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3">
            <CalendarClock className="w-4 h-4 text-blue-500 shrink-0 mt-px" />
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              Data futura detectada — selecione a repetição abaixo.
            </p>
          </div>
        )}

        {isScheduled && (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repetição</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isRecurring && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Término <span className="text-slate-400 font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Bancária</FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isSubmitting} className="flex-1">
                      <SelectValue placeholder="Selecione a conta">
                        {field.value && (
                          <span className="flex items-center gap-2">
                            {(() => {
                              const acc = allAccounts.find((a) => a.id === field.value);
                              const Icon = acc ? getAccountTypeMeta(acc.type).icon : Landmark;
                              return <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />;
                            })()}
                            {allAccounts.find((a) => a.id === field.value)?.name}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allAccounts.map((account) => {
                      const Icon = getAccountTypeMeta(account.type).icon;
                      return (
                        <SelectItem key={account.id} value={account.id}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {account.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isSubmitting}
                      onClick={() => setWalletDialogOpen(true)}
                      className="h-10 w-10 rounded-xl shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Criar nova conta bancária</TooltipContent>
                </Tooltip>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {!selectedIsCard && (
          <FormField
            control={form.control}
            name="pending"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 rounded-2xl border border-slate-100 px-4 py-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-semibold cursor-pointer">
                    {currentType === "income" ? "Ainda não recebi" : "Ainda não paguei"}
                  </FormLabel>
                  <p className="text-[11px] text-slate-400">
                    Fica como {currentType === "income" ? "conta a receber" : "conta a pagar"} e só entra no
                    saldo quando você marcar como {currentType === "income" ? "recebida" : "paga"}.
                  </p>
                </div>
              </FormItem>
            )}
          />
        )}

        {canInstall && (
          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? "1"}>
                  <FormControl>
                    <SelectTrigger disabled={isSubmitting}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INSTALLMENT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 1
                          ? "À vista"
                          : `${n}x${currentAmount > 0 ? ` de ${formatCurrency(Math.round((currentAmount * 100) / n))}` : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">
                  Informe o valor total. Cada parcela entra na fatura de um mês.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        {!isScheduled && (
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
        )}

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
                    {categorySelectOptions(currentType, field.value).map(({ key, label, color, icon: Icon }) => (
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

          {!isScheduled && (
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
          )}
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
              {isScheduled ? <CalendarClock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {isEdit ? "Salvar Alterações" : isScheduled ? "Agendar" : "Criar Transação"}
            </>
          )}
        </Button>

        {/* Delete (edit only) */}
        {canConvert && (
          <div className="rounded-2xl border border-slate-100 p-4 space-y-3">
            {!convertOpen ? (
              <button
                type="button"
                onClick={() => setConvertOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {transaction?.type === "expense"
                  ? "É uma aplicação ou transferência? Converter"
                  : "É um resgate ou transferência? Converter"}
              </button>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Aplicações, resgates e movimentações entre suas contas não são despesa nem receita.
                  {transaction?.type === "expense" ? " O valor vai para a conta escolhida." : " O valor sai da conta escolhida."}
                </p>
                <Select value={convertTarget} onValueChange={setConvertTarget}>
                  <SelectTrigger disabled={isConverting}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__linked__">
                      {linkedInvestment
                        ? linkedInvestment.name
                        : `Investimentos · ${transactionAccount?.name ?? "conta"} (nova)`}
                    </SelectItem>
                    {convertOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isConverting}
                    onClick={() => setConvertOpen(false)}
                    className="rounded-2xl h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={isConverting}
                    onClick={handleConvert}
                    className="rounded-2xl h-10 bg-[#1E1E2D] text-white hover:bg-slate-800 gap-2"
                  >
                    {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Converter"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {isEdit && onDelete && (
          <>
            {isInstallment && (
              <p className="text-xs text-slate-500 text-center">
                Parcela {transaction?.installmentNumber} de {transaction?.installmentTotal}. Alterações
                afetam só esta parcela.
              </p>
            )}
            <div className={cn("grid gap-2", isInstallment && "grid-cols-2")}>
              <button
                type="button"
                onClick={() => {
                  setDeleteScope("single");
                  setConfirmOpen(true);
                }}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isInstallment ? "Excluir parcela" : "Excluir transação"}
              </button>
              {isInstallment && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteScope("installments");
                    setConfirmOpen(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir compra
                </button>
              )}
            </div>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title={deleteScope === "installments" ? "Excluir compra parcelada" : "Excluir transação"}
              description={
                deleteScope === "installments"
                  ? `Todas as ${transaction?.installmentTotal} parcelas serão removidas e o limite do cartão será liberado.`
                  : "Essa ação não pode ser desfeita. A transação será removida permanentemente"
              }
              onConfirm={handleDelete}
              loading={isDeleting}
            />
          </>
        )}
      </form>
    </Form>

    <WalletFormDialog
      open={walletDialogOpen}
      onOpenChange={setWalletDialogOpen}
      wallet={null}
      onCreate={async (data: CreateWalletPayload) => {
        const created = await api.post<BankAccountResponse>("/bank-accounts", data);
        setExtraAccounts((prev) => [...prev, created]);
        form.setValue("bankAccountId", created.id);
        setWalletDialogOpen(false);
      }}
      onUpdate={async (_id: string, _data: UpdateWalletPayload) => {}}
    />
    </>
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
  onCreateScheduled,
  onConvertToTransfer,
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
          onCreateScheduled={onCreateScheduled}
          onConvertToTransfer={onConvertToTransfer}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
