import {
  UtensilsCrossed,
  Car,
  HeartPulse,
  GraduationCap,
  Shirt,
  Home,
  Zap,
  TrendingUp,
  Briefcase,
  DollarSign,
  PartyPopper,
  FileText,
  Scale,
  Tag,
  ShoppingBag,
  ShoppingCart,
  Heart,
  Gift,
  PawPrint,
  Plane,
  Coffee,
  Gamepad2,
  BookOpen,
  PiggyBank,
  Smartphone,
  Dumbbell,
  Baby,
  Wrench,
  Music,
  Receipt,
  LucideIcon,
} from "lucide-react";
import type { CategoryResponse } from "@/types/api";

export interface CategoryStyle {
  color: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  food:          { color: "#8FB800", label: "Alimentação",    icon: UtensilsCrossed }, // lime escuro
  transport:     { color: "#00966B", label: "Transporte",     icon: Car },             // mint escuro
  health:        { color: "#0090BF", label: "Saúde",          icon: HeartPulse },      // sky escuro
  education:     { color: "#4580FF", label: "Educação",       icon: GraduationCap },   // blue — ok
  entertainment: { color: "#9945FF", label: "Entretenimento", icon: PartyPopper },     // violet — ok
  clothing:      { color: "#E0359A", label: "Vestuário",      icon: Shirt },           // pink escuro
  housing:       { color: "#E03050", label: "Moradia",        icon: Home },            // red — ok
  utilities:     { color: "#E06A20", label: "Serviços",       icon: Zap },             // orange escuro
  salary:        { color: "#8FB800", label: "Salário",        icon: DollarSign },
  freelance:     { color: "#00966B", label: "Freelance",      icon: Briefcase },
  investment:    { color: "#4580FF", label: "Investimentos",  icon: TrendingUp },
  others:        { color: "#1E1E2D", label: "Outros",         icon: FileText },
  outros:        { color: "#1E1E2D", label: "Outros",         icon: FileText },
  adjustment:    { color: "#64748B", label: "Ajuste",         icon: Scale },
};

/** Ícones disponíveis para categorias personalizadas (nomes aceitos pela API). */
export const CUSTOM_CATEGORY_ICONS: Record<string, LucideIcon> = {
  tag: Tag,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  home: Home,
  car: Car,
  heart: Heart,
  gift: Gift,
  "paw-print": PawPrint,
  plane: Plane,
  coffee: Coffee,
  gamepad: Gamepad2,
  book: BookOpen,
  briefcase: Briefcase,
  "piggy-bank": PiggyBank,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  baby: Baby,
  wrench: Wrench,
  music: Music,
  receipt: Receipt,
};

/**
 * Categorias personalizadas do workspace atual, registradas pelo hook
 * useCategories. Assim getCategoryStyle resolve nome/cor/ícone delas em
 * qualquer componente, sem precisar receber a lista por props.
 */
const customRegistry = new Map<string, CategoryStyle & { type: "income" | "expense" }>();

export function registerCustomCategories(categories: CategoryResponse[]) {
  customRegistry.clear();
  for (const c of categories) {
    customRegistry.set(c.id, {
      label: c.name,
      color: c.color,
      icon: CUSTOM_CATEGORY_ICONS[c.icon] ?? Tag,
      type: c.type,
    });
  }
}

export function getCategoryStyle(category: string): CategoryStyle {
  return customRegistry.get(category) ?? CATEGORY_STYLES[category] ?? CATEGORY_STYLES.others;
}

/** Categorias que fazem sentido para orçamento (despesas). */
export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "health",
  "education",
  "entertainment",
  "clothing",
  "housing",
  "utilities",
  "others",
] as const;

/** Categorias padrão de receita. */
export const INCOME_CATEGORIES = ["salary", "freelance", "investment", "others"] as const;

export interface CategoryOption extends CategoryStyle {
  key: string;
  type: "income" | "expense";
  custom: boolean;
}

/**
 * Categorias que o usuário pode escolher (padrão + personalizadas), por tipo.
 * "Ajuste" fica de fora: é criado pelo sistema, não escolhido à mão.
 */
export function categoryOptions(type?: "income" | "expense"): CategoryOption[] {
  const builtin = (t: "income" | "expense", keys: readonly string[]) =>
    keys.map((key) => ({ key, type: t, custom: false, ...CATEGORY_STYLES[key] }));
  const custom = (t: "income" | "expense") =>
    [...customRegistry.entries()]
      .filter(([, c]) => c.type === t)
      .map(([key, c]) => ({ key, custom: true, ...c }))
      .sort((a, b) => a.label.localeCompare(b.label));

  const all = [
    ...builtin("expense", EXPENSE_CATEGORIES),
    ...custom("expense"),
    ...builtin("income", INCOME_CATEGORIES),
    ...custom("income"),
  ];
  if (type) return all.filter((o) => o.type === type);
  // Sem tipo (ex.: filtro): "Outros" aparece uma vez só.
  return all.filter((o, i) => all.findIndex((x) => x.key === o.key) === i);
}

/**
 * Opções de um seletor de categoria para o tipo informado. Mantém a categoria
 * já escolhida mesmo que ela não seja do tipo (lançamentos antigos), para o
 * seletor não aparecer vazio ao editar.
 */
export function categorySelectOptions(type: "income" | "expense", current?: string): CategoryOption[] {
  const options = categoryOptions(type);
  if (!current || options.some((o) => o.key === current)) return options;
  return [...options, { key: current, type, custom: false, ...getCategoryStyle(current) }];
}
