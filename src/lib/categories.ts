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
  LucideIcon,
} from "lucide-react";

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
};

export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.others;
}
