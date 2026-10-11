"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
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
import { DatePicker } from "@/components/ui/date-picker";
import { BankAccountResponse, TransferResponse } from "@/types/api";
import { CreateTransferPayload } from "@/hooks/useWallets";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { activeAccounts, getAccountTypeMeta, isCreditCard } from "@/lib/accounts";


const baseSchema = z.object({
  fromAccountId: z.string().min(1, "Selecione a conta de origem"),
  toAccountId: z.string().min(1, "Selecione a conta de destino"),
  amount: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor deve ser positivo"),
  description: z.string().optional(),
  date: z.string().min(1, "Informe a data"),
});

type FormValues = z.infer<typeof baseSchema>;

/** Na edição, o valor original da transferência volta para a conta de origem. */
function makeSchema(accounts: BankAccountResponse[], editing?: TransferResponse | null) {
  return baseSchema.superRefine((d, ctx) => {
    if (d.fromAccountId && d.toAccountId && d.fromAccountId === d.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contas de origem e destino devem ser diferentes",
        path: ["toAccountId"],
      });
    }

    const from = accounts.find((a) => a.id === d.fromAccountId);
    // Cartão de crédito não é origem de saldo (seria saque no crédito).
    const available =
      (from?.balance ?? 0) + (editing && editing.fromAccountId === from?.id ? editing.amount : 0);
    if (from && !isCreditCard(from) && d.amount && parseFloat(d.amount) > available / 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Saldo insuficiente. Disponível: ${formatCurrency(available)}`,
        path: ["amount"],
      });
    }
  });
}

/** Valores iniciais opcionais (ex.: pagamento de fatura de cartão). */
export interface TransferDefaults {
  fromAccountId?: string;
  toAccountId?: string;
  /** Centavos. */
  amount?: number;
  description?: string;
}

interface TransferFormProps {
  accounts: BankAccountResponse[];
  defaults?: TransferDefaults;
  transfer?: TransferResponse | null;
  onCreate: (data: CreateTransferPayload) => Promise<void>;
  onUpdate?: (id: string, data: CreateTransferPayload) => Promise<void>;
  onClose: () => void;
}

function TransferForm({ accounts, defaults, transfer, onCreate, onUpdate, onClose }: TransferFormProps) {
  const isEdit = !!transfer && !!onUpdate;
  const toDefault = transfer?.toAccountId ?? defaults?.toAccountId ?? accounts[1]?.id ?? "";
  // Origem padrão: primeira conta que não seja o destino nem um cartão.
  const fromDefault =
    transfer?.fromAccountId ??
    defaults?.fromAccountId ??
    accounts.find((a) => a.id !== toDefault && !isCreditCard(a))?.id ??
    accounts.find((a) => a.id !== toDefault)?.id ??
    "";

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(accounts, transfer)),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      fromAccountId: fromDefault,
      toAccountId: toDefault,
      amount: transfer
        ? (transfer.amount / 100).toFixed(2)
        : defaults?.amount
          ? (defaults.amount / 100).toFixed(2)
          : "",
      description: transfer?.description ?? defaults?.description ?? "",
      // Data local (toISOString usaria UTC e viraria "amanhã" depois das 21h).
      date: transfer?.date ?? format(new Date(), "yyyy-MM-dd"),
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const isValid = form.formState.isValid;
  const fromId = form.watch("fromAccountId");
  const toId = form.watch("toAccountId");
  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  // Revalidate amount when source account changes so balance limit updates
  const { trigger } = form;
  const prevFromId = useRef(fromId);
  if (prevFromId.current !== fromId) {
    prevFromId.current = fromId;
    trigger("amount");
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      fromAccountId: values.fromAccountId,
      toAccountId: values.toAccountId,
      amount: parseFloat(values.amount),
      description: values.description || undefined,
      date: values.date,
    };
    try {
      if (isEdit && transfer && onUpdate) {
        await onUpdate(transfer.id, payload);
        toast.success("Transferência atualizada");
      } else {
        await onCreate(payload);
        toast.success("Transferência realizada");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar transferência");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {fromAccount && toAccount && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: fromAccount.color }}
            >
              {(() => { const Icon = getAccountTypeMeta(fromAccount.type).icon; return <Icon className="w-4 h-4" />; })()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{fromAccount.name}</p>
              <p className="text-[10px] text-slate-400">{formatCurrency(fromAccount.balance)}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: toAccount.color }}
            >
              {(() => { const Icon = getAccountTypeMeta(toAccount.type).icon; return <Icon className="w-4 h-4" />; })()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{toAccount.name}</p>
              <p className="text-[10px] text-slate-400">{formatCurrency(toAccount.balance)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>De</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((a) => {
                      const Icon = getAccountTypeMeta(a.type).icon;
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 shrink-0" style={{ color: a.color }} />
                            {a.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Para</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Destino" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== fromId)
                      .map((a) => {
                        const Icon = getAccountTypeMeta(a.type).icon;
                        return (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4 shrink-0" style={{ color: a.color }} />
                              {a.name}
                            </span>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  <DatePicker value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: reserva mensal, pagamento..." disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting || accounts.length < 2 || !isValid}
          className={cn(
            "w-full rounded-2xl h-12 font-semibold gap-2 mt-2",
            "bg-[#1E1E2D] text-white hover:bg-slate-800",
          )}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              {isEdit ? "Salvar Alterações" : "Transferir"}
            </>
          )}
        </Button>

        {accounts.length < 2 && (
          <p className="text-xs text-center text-slate-400">
            Você precisa de pelo menos 2 contas para realizar uma transferência.
          </p>
        )}
      </form>
    </Form>
  );
}

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: BankAccountResponse[];
  defaults?: TransferDefaults;
  title?: string;
  subtitle?: string;
  /** Transferência a editar (requer `onUpdate`). */
  transfer?: TransferResponse | null;
  onCreate: (data: CreateTransferPayload) => Promise<void>;
  onUpdate?: (id: string, data: CreateTransferPayload) => Promise<void>;
}

export function TransferFormDialog({
  open,
  onOpenChange,
  accounts,
  defaults,
  title,
  subtitle,
  transfer,
  onCreate,
  onUpdate,
}: TransferFormDialogProps) {
  const selectable = activeAccounts(accounts);
  const isEdit = !!transfer && !!onUpdate;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? (isEdit ? "Editar transferência" : "Transferência entre contas")}</DialogTitle>
          <p className="text-sm text-slate-400">
            {subtitle ??
              (isEdit
                ? "Os saldos das contas envolvidas são ajustados automaticamente"
                : "Mova saldo entre suas contas instantaneamente")}
          </p>
        </DialogHeader>
        <TransferForm
          key={open ? `open-${transfer?.id ?? "new"}` : "closed"}
          accounts={selectable}
          defaults={defaults}
          transfer={transfer}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
