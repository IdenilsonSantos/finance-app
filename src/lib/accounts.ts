import { Banknote, Building2, CreditCard, Landmark, PiggyBank, LucideIcon } from "lucide-react";
import type { BankAccountResponse } from "@/types/api";

export interface AccountTypeMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const ACCOUNT_TYPE_META: Record<string, AccountTypeMeta> = {
  checking: { label: "C. Corrente", icon: Landmark, color: "#3b82f6" },
  savings: { label: "Poupança", icon: PiggyBank, color: "#22c55e" },
  investment: { label: "Investimento", icon: Building2, color: "#a855f7" },
  cash: { label: "Dinheiro", icon: Banknote, color: "#f97316" },
  credit_card: { label: "Cartão de Crédito", icon: CreditCard, color: "#ef4444" },
};

export function getAccountTypeMeta(type: string): AccountTypeMeta {
  return ACCOUNT_TYPE_META[type] ?? ACCOUNT_TYPE_META.checking;
}

export function isCreditCard(account?: Pick<BankAccountResponse, "type"> | null): boolean {
  return account?.type === "credit_card";
}

/** Contas que podem receber lançamentos (exclui arquivadas). */
export function activeAccounts<T extends Pick<BankAccountResponse, "archivedAt">>(accounts: T[]): T[] {
  return accounts.filter((a) => !a.archivedAt);
}
