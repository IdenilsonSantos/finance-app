"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PiggyBank, ArrowDownToLine } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  /** Quando informado, habilita o modo "Resgatar". */
  onWithdraw?: (id: string, amountInCents: number) => Promise<void>;
}

type Mode = "deposit" | "withdraw";

export function ContributeDialog({ open, onOpenChange, goal, onContribute, onWithdraw }: ContributeDialogProps) {
  const [mode, setMode] = useState<Mode>("deposit");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  if (!goal) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

  const isWithdraw = mode === "withdraw";

  async function onSubmit(values: FormValues) {
    if (!goal) return;
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    if (isWithdraw && amountInCents > goal.currentAmount) {
      form.setError("amount", {
        message: `Máximo para resgate: ${formatCurrency(goal.currentAmount)}`,
      });
      return;
    }
    try {
      if (isWithdraw && onWithdraw) {
        await onWithdraw(goal.id, amountInCents);
        toast.success("Resgate registrado");
      } else {
        await onContribute(goal.id, amountInCents);
        toast.success("Contribuição adicionada");
      }
      form.reset();
      setMode("deposit");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao movimentar meta");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          form.reset();
          setMode("deposit");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isWithdraw ? "Resgatar da Meta" : "Contribuir para Meta"}</DialogTitle>
          <p className="text-sm text-slate-400">
            {isWithdraw
              ? "Retire parte do valor guardado nesta meta"
              : "Adicione um valor ao progresso da meta"}
          </p>
        </DialogHeader>

        {onWithdraw && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
            {(
              [
                { id: "deposit", label: "Guardar" },
                { id: "withdraw", label: "Resgatar" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={opt.id === "withdraw" && goal.currentAmount <= 0}
                onClick={() => {
                  setMode(opt.id);
                  form.clearErrors();
                }}
                className={cn(
                  "h-9 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40",
                  mode === opt.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

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
            {isWithdraw ? (
              <>
                Disponível para resgate:{" "}
                <span className="font-semibold text-slate-700">{formatCurrency(goal.currentAmount)}</span>
              </>
            ) : remaining > 0 ? (
              <>
                Faltam <span className="font-semibold text-slate-700">{formatCurrency(remaining)}</span> para atingir a meta
              </>
            ) : (
              <>Meta atingida! Novos aportes ficam guardados acima do alvo.</>
            )}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isWithdraw ? "Valor a resgatar" : "Valor a contribuir"}</FormLabel>
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
                isWithdraw ? (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    Resgatar
                  </>
                ) : (
                  <>
                    <PiggyBank className="w-4 h-4" />
                    Contribuir
                  </>
                )
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
