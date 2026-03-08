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
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountResponse {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  color: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
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
}

// Dashboard

export interface DashboardAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
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
  description: string;
  date: string;
  bankAccountId: string;
  bankAccountName: string | null;
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
