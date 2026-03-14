"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, ArrowRight, Building2, PiggyBank, Landmark, CreditCard } from "lucide-react";
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
import { BankAccountResponse } from "@/types/api";
import { CreateTransferPayload } from "@/hooks/useWallets";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const TYPE_ICONS: Record<string, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  investment: Building2,
  cash: CreditCard,
};

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

function makeSchema(accounts: BankAccountResponse[]) {
  return baseSchema.superRefine((d, ctx) => {
    if (d.fromAccountId && d.toAccountId && d.fromAccountId === d.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contas de origem e destino devem ser diferentes",
        path: ["toAccountId"],
      });
    }

    const from = accounts.find((a) => a.id === d.fromAccountId);
    if (from && d.amount && parseFloat(d.amount) > from.balance / 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Saldo insuficiente. Disponível: ${formatCurrency(from.balance)}`,
        path: ["amount"],
      });
    }
  });
}

interface TransferFormProps {
  accounts: BankAccountResponse[];
  onCreate: (data: CreateTransferPayload) => Promise<void>;
  onClose: () => void;
}

function TransferForm({ accounts, onCreate, onClose }: TransferFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(accounts)),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      fromAccountId: accounts[0]?.id ?? "",
      toAccountId: accounts[1]?.id ?? "",
      amount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
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
    try {
      await onCreate({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: parseFloat(values.amount),
        description: values.description || undefined,
        date: values.date,
      });
      toast.success("Transferência realizada");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao realizar transferência");
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
              {(() => { const Icon = TYPE_ICONS[fromAccount.type] ?? Landmark; return <Icon className="w-4 h-4" />; })()}
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
              {(() => { const Icon = TYPE_ICONS[toAccount.type] ?? Landmark; return <Icon className="w-4 h-4" />; })()}
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
                      const Icon = TYPE_ICONS[a.type] ?? Landmark;
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
                        const Icon = TYPE_ICONS[a.type] ?? Landmark;
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
              Transferir
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
  onCreate: (data: CreateTransferPayload) => Promise<void>;
}

export function TransferFormDialog({ open, onOpenChange, accounts, onCreate }: TransferFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transferência entre contas</DialogTitle>
          <p className="text-sm text-slate-400">
            Mova saldo entre suas contas instantaneamente
          </p>
        </DialogHeader>
        <TransferForm
          key={open ? "open" : "closed"}
          accounts={accounts}
          onCreate={onCreate}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
