// Pagination

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Scheduled Transactions

export interface ScheduledTransactionResponse {
  id: string;
  workspaceId: string;
  bankAccountId: string;
  amount: number;
  type: "income" | "expense";
  description: string | null;
  category: string;
  frequency: "once" | "daily" | "weekly" | "monthly" | "yearly";
  nextDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Goals

export interface GoalResponse {
  id: string;
  workspaceId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// Transactions

export interface TransactionResponse {
  id: string;
  workspaceId: string;
  bankAccountId: string;
  amount: number;
  type: "income" | "expense";
  description: string | null;
  beneficiary: string | null;
  category: string;
  paymentMethod: string | null;
  date: string;
  /** `pending` = conta a pagar/receber: ainda não alterou o saldo. */
  status: TransactionStatus;
  /** Compras parceladas no cartão: parcelas compartilham o grupo. */
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = "paid" | "pending";

export interface TransactionsSummaryResponse {
  /** Receitas efetivadas. */
  income: number;
  /** Despesas efetivadas. */
  expense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  /** A receber no período. */
  pendingIncome: number;
  /** A pagar no período. */
  pendingExpense: number;
  pendingCount: number;
  /** Pendências com data anterior a hoje. */
  overdueCount: number;
  activeDates: string[];
}

// Transfers

export interface TransferResponse {
  id: string;
  workspaceId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Reports

export interface ReportTotals {
  income: number;
  expense: number;
  balance: number;
  /** Fração do que entrou que sobrou (0.25 = 25%); null sem receitas. */
  savingsRate: number | null;
  incomeCount: number;
  expenseCount: number;
}

export interface ReportCategory {
  category: string;
  type: "income" | "expense";
  total: number;
  count: number;
  /** Participação no total do tipo (0..1). */
  share: number;
  previousTotal: number;
  /** Variação relativa ao período anterior; null quando lá era zero. */
  change: number | null;
  months: { month: string; total: number }[];
}

export interface ReportResponse {
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string };
  totals: ReportTotals;
  previousTotals: ReportTotals;
  months: { month: string; income: number; expense: number; balance: number }[];
  categories: ReportCategory[];
}

// Categories

/** Categoria personalizada do workspace (as padrão ficam em lib/categories). */
export interface CategoryResponse {
  id: string;
  workspaceId: string;
  name: string;
  type: "income" | "expense";
  color: string;
  /** Nome do ícone (ver CUSTOM_CATEGORY_ICONS). */
  icon: string;
  createdAt: string;
  updatedAt: string;
}

// Budgets

/** Categoria do orçamento global do mês (teto de todas as despesas). */
export const GLOBAL_BUDGET_CATEGORY = "all";

export interface BudgetSummaryItem {
  id: string;
  category: string;
  amount: number;
  month: string;
  spentAmount: number;
  remaining: number;
  percentUsed: number;
}

export type BankAccountType = "checking" | "savings" | "investment" | "cash" | "credit_card";

export interface BankAccountResponse {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  color: string;
  /** Em cartões de crédito fica negativo enquanto houver valor a pagar. */
  balance: number;
  /** Cartão de crédito: limite em centavos. */
  creditLimit: number | null;
  closingDay: number | null;
  dueDay: number | null;
  archivedAt: string | null;
  /** Conta de origem, quando esta é a conta de investimento vinculada a ela. */
  linkedAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "open" | "closed" | "paid" | "overdue";

export interface InvoiceResponse {
  /** Mês da fatura (mês do vencimento), YYYY-MM. */
  month: string;
  start: string;
  end: string;
  closingDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  remaining: number;
  creditLimit: number | null;
  usedLimit: number;
  availableLimit: number | null;
  transactions: TransactionResponse[];
}

// Auth

export interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export interface RegisterResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

// Workspace

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  role?: WorkspaceMemberRole;
}

export type WorkspaceMemberRole = "owner" | "admin" | "member";

export interface WorkspaceMemberResponse {
  id: string;
  role: WorkspaceMemberRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
}

export interface WorkspaceInviteInfoResponse {
  workspaceName: string;
  invitedEmail: string;
  role: WorkspaceMemberRole;
  inviterName: string;
  expiresAt: string;
}

// Dashboard

export interface DashboardAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  creditLimit: number | null;
}

export interface DashboardFinancialInsights {
  totalBalance: number;
  reservedForGoals: number;
  availableLiquidity: number;
  projectedBalance: number;
  remainingBudget: number;
  monthlyGoalsTarget: number;
  isOverBudget: boolean;
  savingsRate: number;
  monthExpenses: number;
  monthIncome: number;
  monthSavings: number;
  /** A receber até o fim do mês (inclui atrasadas). */
  pendingIncome: number;
  /** A pagar até o fim do mês (inclui atrasadas). */
  pendingExpenses: number;
  overdueCount: number;
}

export interface DashboardCashFlowItem {
  month: string;
  income: number;
  expenses: number;
}

export interface DashboardSavingsItem {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface DashboardCategoryItem {
  category: string;
  value: number;
  percentage: number;
}

export interface DashboardBudget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface DashboardGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  percentage: number;
}

export interface DashboardTransaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string | null;
  beneficiary: string | null;
  paymentMethod: string | null;
  date: string;
  status: TransactionStatus;
  bankAccountId: string;
  bankAccountName: string | null;
  bankAccountColor: string | null;
  createdAt: string;
}

export interface DashboardScheduledTransaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  frequency: string;
  nextDate: string;
  bankAccountId: string;
  bankAccountName: string | null;
}

export interface DashboardResponse {
  accounts: DashboardAccount[];
  financialInsights: DashboardFinancialInsights;
  cashFlow: DashboardCashFlowItem[];
  savingsOverview: DashboardSavingsItem[];
  expensesByCategory: DashboardCategoryItem[];
  averageSavings: number;
  currentMonthSavings: number;
  budgets: DashboardBudget[];
  goals: DashboardGoal[];
  recentTransactions: DashboardTransaction[];
  upcomingScheduled: DashboardScheduledTransaction[];
}
