"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CalendarClock, Trash2, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CATEGORY_STYLES } from "@/lib/categories";
import { ScheduledTransactionResponse, BankAccountResponse } from "@/types/api";
import {
  CreateScheduledTransactionPayload,
  UpdateScheduledTransactionPayload,
} from "@/hooks/useScheduledTransactions";
import { cn } from "@/lib/utils";

const FREQUENCIES = [
  { value: "once",    label: "Uma vez" },
  { value: "daily",   label: "Diário" },
  { value: "weekly",  label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly",  label: "Anual" },
] as const;

const CATEGORIES = Object.entries(CATEGORY_STYLES)
  .filter(([key]) => key !== "outros")
  .map(([key, style]) => ({ key, label: style.label, color: style.color, Icon: style.icon }));

const schema = z.object({
  bankAccountId: z.string().min(1, "Selecione uma conta"),
  amount: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor deve ser positivo"),
  type: z.enum(["income", "expense"]),
  description: z.string().optional(),
  category: z.string().min(1, "Selecione uma categoria"),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "yearly"]),
  nextDate: z.string().min(1, "Informe a data"),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ScheduledTransactionResponse | null;
  bankAccounts: BankAccountResponse[];
  onCreate: (data: CreateScheduledTransactionPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateScheduledTransactionPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ScheduledTransactionFormDialog({
  open,
  onOpenChange,
  item,
  bankAccounts,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const isEdit = !!item;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          bankAccountId: item.bankAccountId,
          amount: (item.amount / 100).toFixed(2),
          type: item.type,
          description: item.description ?? "",
          category: item.category,
          frequency: item.frequency,
          nextDate: item.nextDate ?? "",
          endDate: item.endDate ?? "",
        }
      : {
          bankAccountId: bankAccounts[0]?.id ?? "",
          amount: "",
          type: "expense",
          description: "",
          category: "",
          frequency: "monthly",
          nextDate: "",
          endDate: "",
        },
  });

  const isSubmitting = form.formState.isSubmitting;
  const currentType = form.watch("type");
  const currentFrequency = form.watch("frequency");

  async function onSubmit(values: FormValues) {
    const amount = parseFloat(values.amount);
    try {
      if (isEdit && item) {
        await onUpdate(item.id, {
          bankAccountId: values.bankAccountId,
          amount,
          type: values.type,
          description: values.description || undefined,
          category: values.category,
          frequency: values.frequency,
          nextDate: values.nextDate,
          endDate: values.endDate || undefined,
        });
        toast.success("Agendamento atualizado");
      } else {
        await onCreate({
          bankAccountId: values.bankAccountId,
          amount,
          type: values.type,
          description: values.description || undefined,
          category: values.category,
          frequency: values.frequency,
          nextDate: values.nextDate,
          endDate: values.endDate || undefined,
        });
        toast.success("Agendamento criado");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar agendamento");
    }
  }

  async function handleDelete() {
    if (!item || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      toast.success("Agendamento excluído");
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir agendamento");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <p className="text-sm text-slate-400">
            {isEdit ? "Atualize os detalhes do agendamento" : "Configure uma transação recorrente"}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="nextDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {currentFrequency === "once" ? "Data" : "Próxima data"}
                    </FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {currentFrequency !== "once" && (
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Término <span className="text-slate-400 font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker value={field.value ?? ""} onChange={field.onChange} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue placeholder="Selecione a conta" />
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

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue placeholder="Selecione a categoria" />
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl h-12 bg-[#1E1E2D] text-white hover:bg-slate-800 font-semibold gap-2 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CalendarClock className="w-4 h-4" />
                  {isEdit ? "Salvar Alterações" : "Criar Agendamento"}
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
                  Excluir agendamento
                </button>
                <ConfirmDialog
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  title="Excluir agendamento"
                  description="Esse agendamento será removido permanentemente. As transações já executadas não serão afetadas."
                  onConfirm={handleDelete}
                  loading={isDeleting}
                />
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
