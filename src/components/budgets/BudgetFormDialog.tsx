"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { categoryOptions, getCategoryStyle } from "@/lib/categories";
import { BudgetSummaryItem, GLOBAL_BUDGET_CATEGORY } from "@/types/api";

const schema = z.object({
  category: z.string().min(1, "Selecione a categoria"),
  amount: z
    .string()
    .min(1, "Informe o limite")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "O limite deve ser maior que zero"),
});

type FormValues = z.infer<typeof schema>;

export function budgetCategoryLabel(category: string) {
  return category === GLOBAL_BUDGET_CATEGORY ? "Total do mês" : getCategoryStyle(category).label;
}

interface BudgetFormProps {
  budget: BudgetSummaryItem | null;
  usedCategories: string[];
  onCreate: (category: string, amountInCents: number) => Promise<void>;
  onUpdate: (id: string, amountInCents: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

function BudgetForm({ budget, usedCategories, onCreate, onUpdate, onDelete, onClose }: BudgetFormProps) {
  const isEdit = !!budget;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const available = [GLOBAL_BUDGET_CATEGORY, ...categoryOptions("expense").map((o) => o.key)].filter(
    (c) => c === budget?.category || !usedCategories.includes(c),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: budget?.category ?? available[0] ?? "",
      amount: budget ? (budget.amount / 100).toFixed(2) : "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    const amountInCents = Math.round(parseFloat(values.amount) * 100);
    try {
      if (budget) {
        await onUpdate(budget.id, amountInCents);
        toast.success("Orçamento atualizado");
      } else {
        await onCreate(values.category, amountInCents);
        toast.success("Orçamento criado");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento");
    }
  }

  async function handleDelete() {
    if (!budget) return;
    setIsDeleting(true);
    try {
      await onDelete(budget.id);
      toast.success("Orçamento removido");
      setConfirmOpen(false);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover orçamento");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isEdit && available.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        Todas as categorias já têm orçamento neste mês. Edite um orçamento existente.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isEdit || isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {available.map((c) => (
                    <SelectItem key={c} value={c}>
                      {budgetCategoryLabel(c)}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite mensal</FormLabel>
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
          className="w-full rounded-2xl h-12 bg-[#1E1E2D] text-white hover:bg-slate-800 font-semibold gap-2 mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              {isEdit ? "Salvar Alterações" : "Criar Orçamento"}
            </>
          )}
        </Button>

        {isEdit && (
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remover orçamento
            </button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Remover orçamento"
              description="O limite deste mês será removido. Suas transações não são afetadas."
              confirmLabel="Remover"
              onConfirm={handleDelete}
              loading={isDeleting}
            />
          </>
        )}
      </form>
    </Form>
  );
}

interface BudgetFormDialogProps extends Omit<BudgetFormProps, "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetFormDialog({ open, onOpenChange, budget, ...rest }: BudgetFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
          <p className="text-sm text-slate-400">
            Defina quanto pretende gastar no mês. Transferências e ajustes de saldo não contam.
          </p>
        </DialogHeader>
        <BudgetForm
          key={budget?.id ?? "new"}
          budget={budget}
          {...rest}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
