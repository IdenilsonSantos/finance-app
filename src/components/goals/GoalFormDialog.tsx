"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Trash2, Target } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GoalResponse } from "@/types/api";
import { CreateGoalPayload, UpdateGoalPayload } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#a855f7",
  "#eab308",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#1E1E2D",
  "#64748b",
];

const schema = z.object({
  name: z.string().min(1, "Informe o nome da meta"),
  targetAmount: z
    .string()
    .min(1, "Informe o valor alvo")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor inválido"),
  deadline: z.string().optional(),
  color: z.string().min(1, "Selecione uma cor"),
});

type FormValues = z.infer<typeof schema>;

interface GoalFormProps {
  goal?: GoalResponse | null;
  onCreate: (data: CreateGoalPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateGoalPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

function GoalForm({ goal, onCreate, onUpdate, onDelete, onClose }: GoalFormProps) {
  const isEdit = !!goal;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: goal
      ? {
          name: goal.name,
          targetAmount: (goal.targetAmount / 100).toFixed(2),
          deadline: goal.deadline ?? "",
          color: goal.color,
        }
      : {
          name: "",
          targetAmount: "",
          deadline: "",
          color: PRESET_COLORS[0],
        },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedColor = form.watch("color");

  async function onSubmit(values: FormValues) {
    try {
      const amountInCents = Math.round(parseFloat(values.targetAmount) * 100);
      const deadline = values.deadline || undefined;

      if (isEdit && goal) {
        await onUpdate(goal.id, {
          name: values.name,
          targetAmount: amountInCents,
          deadline: deadline ?? null,
          color: values.color,
        });
        toast.success("Meta atualizada");
      } else {
        await onCreate({
          name: values.name,
          targetAmount: amountInCents,
          deadline,
          color: values.color,
        });
        toast.success("Meta criada");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar meta");
    }
  }

  async function handleDelete() {
    if (!goal || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(goal.id);
      toast.success("Meta excluída");
      setConfirmOpen(false);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir meta");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
   
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white transition-colors"
            style={{ backgroundColor: selectedColor }}
          >
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {form.watch("name") || "Nome da meta"}
            </p>
            <p className="text-xs text-slate-400">
              {form.watch("targetAmount")
                ? `Alvo: R$ ${parseFloat(form.watch("targetAmount") || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "Defina um valor alvo"}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da meta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Viagem, Reserva de emergência..." disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor alvo</FormLabel>
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
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo <span className="text-slate-400 font-normal">(opcional)</span></FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value || undefined}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  placeholder="Sem prazo definido"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              {isEdit ? "Salvar Alterações" : "Criar Meta"}
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
              Excluir meta
            </button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Excluir meta"
              description="Essa ação não pode ser desfeita. A meta será removida permanentemente."
              onConfirm={handleDelete}
              loading={isDeleting}
            />
          </>
        )}
      </form>
    </Form>
  );
}

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalResponse | null;
  onCreate: (data: CreateGoalPayload) => Promise<void>;
  onUpdate: (id: string, data: UpdateGoalPayload) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  onCreate,
  onUpdate,
  onDelete,
}: GoalFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          <p className="text-sm text-slate-400">
            {goal ? "Atualize os detalhes da sua meta" : "Defina um novo objetivo financeiro"}
          </p>
        </DialogHeader>
        <GoalForm
          key={goal?.id ?? "new"}
          goal={goal}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
