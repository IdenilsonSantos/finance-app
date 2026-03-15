"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PiggyBank } from "lucide-react";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { GoalResponse } from "@/types/api";
import { formatCurrency } from "@/lib/format";

const schema = z.object({
  amount: z
    .string()
    .min(1, "Informe o valor")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor deve ser maior que zero"),
});

type FormValues = z.infer<typeof schema>;

interface ContributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GoalResponse | null;
  onContribute: (id: string, amountInCents: number) => Promise<void>;
}

export function ContributeDialog({ open, onOpenChange, goal, onContribute }: ContributeDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  if (!goal) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

  async function onSubmit(values: FormValues) {
    if (!goal) return;
    try {
      const amountInCents = Math.round(parseFloat(values.amount) * 100);
      await onContribute(goal.id, amountInCents);
      toast.success("Contribuição adicionada");
      form.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao contribuir");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Contribuir para Meta</DialogTitle>
          <p className="text-sm text-slate-400">Adicione um valor ao progresso da meta</p>
        </DialogHeader>

        {/* Goal summary */}
        <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: goal.color }}
            >
              <PiggyBank className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{goal.name}</p>
              <p className="text-xs text-slate-400">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: goal.color }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Faltam <span className="font-semibold text-slate-700">{formatCurrency(Math.max(remaining, 0))}</span> para atingir a meta
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor a contribuir</FormLabel>
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl h-12 font-semibold gap-2"
              style={{ backgroundColor: goal.color }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <PiggyBank className="w-4 h-4" />
                  Contribuir
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
