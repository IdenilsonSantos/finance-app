"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { CUSTOM_CATEGORY_ICONS, categoryOptions, type CategoryOption } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { CategoryResponse } from "@/types/api";

/** Mesma paleta dos outros formulários (metas, contas). */
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

type CategoryType = "income" | "expense";

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria").max(40, "Use até 40 caracteres"),
  type: z.enum(["income", "expense"]),
  color: z.string().min(1, "Selecione uma cor"),
  icon: z.string().min(1, "Selecione um ícone"),
});

type FormValues = z.infer<typeof schema>;

function CategoryChip({ option }: { option: CategoryOption }) {
  const Icon = option.icon;
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0"
      style={{ backgroundColor: option.color + "20" }}
    >
      <Icon className="w-4 h-4" style={{ color: option.color }} />
    </span>
  );
}

// ---------------------------------------------------------------- formulário
interface CategoryFormProps {
  category: CategoryResponse | null;
  defaultType: CategoryType;
  onDelete?: (category: CategoryResponse) => void;
  onClose: () => void;
}

function CategoryForm({ category, defaultType, onDelete, onClose }: CategoryFormProps) {
  const isEdit = !!category;
  const { createCategory, updateCategory } = useCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? defaultType,
      color: category?.color ?? PRESET_COLORS[0],
      icon: category?.icon ?? "tag",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedColor = form.watch("color");
  const selectedType = form.watch("type");
  const PreviewIcon = CUSTOM_CATEGORY_ICONS[form.watch("icon")] ?? CUSTOM_CATEGORY_ICONS.tag;

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit && category) {
        await updateCategory(category.id, { name: values.name, color: values.color, icon: values.icon });
        toast.success("Categoria atualizada");
      } else {
        await createCategory(values);
        toast.success("Categoria criada");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar categoria");
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
            <PreviewIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{form.watch("name") || "Nome da categoria"}</p>
            <p className="text-xs text-slate-400">{selectedType === "income" ? "Receita" : "Despesa"}</p>
          </div>
        </div>

        {!isEdit && (
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
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da categoria</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Pets, Assinaturas, Presentes..."
                  maxLength={40}
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
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ícone</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(CUSTOM_CATEGORY_ICONS).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      disabled={isSubmitting}
                      onClick={() => field.onChange(key)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2",
                        field.value === key
                          ? "border-slate-900 bg-slate-100 scale-110 shadow-md"
                          : "border-transparent bg-slate-50 hover:scale-105",
                      )}
                    >
                      <Icon className="w-4 h-4 text-slate-600" />
                    </button>
                  ))}
                </div>
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
                      aria-label={`Cor ${color}`}
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
              {isEdit ? "Salvar Alterações" : "Criar Categoria"}
            </>
          )}
        </Button>

        {isEdit && category && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(category)}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir categoria
          </button>
        )}
      </form>
    </Form>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultType,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryResponse | null;
  defaultType: CategoryType;
  onDelete: (category: CategoryResponse) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          <p className="text-sm text-slate-400">
            {category ? "Atualize o nome, o ícone ou a cor da categoria" : "Crie uma categoria para organizar seus lançamentos"}
          </p>
        </DialogHeader>
        <CategoryForm
          key={category?.id ?? `new-${defaultType}`}
          category={category}
          defaultType={defaultType}
          onDelete={onDelete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- exclusão
function DeleteCategoryDialog({
  category,
  onOpenChange,
}: {
  category: CategoryResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteCategory } = useCategories();
  const [replaceWith, setReplaceWith] = useState("others");
  const [deleting, setDeleting] = useState(false);
  const targets = category ? categoryOptions(category.type).filter((o) => o.key !== category.id) : [];

  async function handleDelete() {
    if (!category) return;
    setDeleting(true);
    try {
      const { movedTransactions } = await deleteCategory(category.id, replaceWith);
      toast.success(
        movedTransactions > 0
          ? `Categoria excluída. ${movedTransactions} lançamento${movedTransactions > 1 ? "s" : ""} movido${movedTransactions > 1 ? "s" : ""}.`
          : "Categoria excluída",
      );
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir categoria");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={!!category} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir categoria</DialogTitle>
          <p className="text-sm text-slate-400">
            Os lançamentos e agendamentos de “{category?.name}” vão para a categoria escolhida abaixo, e os
            orçamentos dela serão removidos. Essa ação não pode ser desfeita.
          </p>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-medium">Mover lançamentos para</p>
          <Select value={replaceWith} onValueChange={setReplaceWith} disabled={deleting}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targets.map((o) => {
                const Icon = o.icon;
                return (
                  <SelectItem key={o.key} value={o.key}>
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: o.color }} />
                      {o.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 rounded-2xl h-11 bg-red-500 hover:bg-red-600 text-white font-semibold"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- seção
export function CategoriesSection() {
  const { categories, loading } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [formType, setFormType] = useState<CategoryType>("expense");
  const [deleting, setDeleting] = useState<CategoryResponse | null>(null);

  function openCreate(type: CategoryType) {
    setEditing(null);
    setFormType(type);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {(["expense", "income"] as const).map((type) => (
        <div key={type} className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {type === "expense" ? "Categorias de despesa" : "Categorias de receita"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                As padrão não podem ser alteradas; crie as suas para organizar do seu jeito.
              </p>
            </div>
            <Button
              onClick={() => openCreate(type)}
              className="bg-[#1E1E2D] text-white hover:bg-slate-700 font-semibold rounded-2xl gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova categoria</span>
            </Button>
          </div>
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {categoryOptions(type).map((option) => {
                const custom = categories.find((c) => c.id === option.key);
                return (
                  <li key={option.key} className="group flex items-center gap-3 px-6 py-3">
                    <CategoryChip option={option} />
                    <span className="flex-1 text-sm font-medium text-slate-800">{option.label}</span>
                    {custom ? (
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar categoria"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            setEditing(custom);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir categoria"
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleting(custom)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        category={editing}
        defaultType={formType}
        onDelete={(category) => {
          setFormOpen(false);
          setEditing(null);
          setDeleting(category);
        }}
      />
      <DeleteCategoryDialog
        key={deleting?.id ?? "none"}
        category={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
