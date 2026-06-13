import type {
  AnomalySeverity,
  AnomalyStatus,
  AnomalyType,
  ImportStatus,
} from "@prisma/client";

export interface DashboardOverview {
  totalGroups: number;
  activeGroups: number;
  totalExpenses: number;
  activeExpenses: number;
  totalSettlements: number;
  totalImportSessions: number;
  totalAnomalies: number;
  outstandingBalance: number;
  totalAmountTracked: number;
  currenciesUsed: string[];
  generatedAt: string;
}

export interface DashboardRecentImport {
  id: string;
  filename: string;
  status: ImportStatus;
  importedRows: number;
  rejectedRows: number;
  anomalyCount: number;
  createdAt: string;
}

export interface DashboardAnomalyOverview {
  totalAnomalies: number;
  byType: Record<AnomalyType, number>;
  bySeverity: Record<AnomalySeverity, number>;
  openCount: number;
  resolvedCount: number;
  recentAnomalies: Array<{
    id: string;
    importSessionId: string;
    expenseId: string | null;
    type: AnomalyType;
    severity: AnomalySeverity;
    status: AnomalyStatus;
    payload: unknown;
    createdAt: string;
  }>;
}

export interface DashboardGroupAnalytics {
  totalGroups: number;
  activeGroups: number;
  averageMembersPerGroup: number;
  largestGroup: {
    id: string;
    name: string;
    memberCount: number;
  } | null;
  newestGroup: {
    id: string;
    name: string;
    createdAt: string;
  } | null;
  archivedGroups: number;
}

export interface DashboardExpenseAnalytics {
  totalExpenses: number;
  totalExpenseAmount: number;
  averageExpenseAmount: number;
  highestExpense: DashboardExpenseSummary | null;
  lowestExpense: DashboardExpenseSummary | null;
  expensesThisMonth: number;
  expensesLastMonth: number;
}

export interface DashboardExpenseSummary {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
}

export interface DashboardSettlementAnalytics {
  totalSettlements: number;
  totalSettlementAmount: number;
  averageSettlementAmount: number;
  settlementsThisMonth: number;
  settlementsLastMonth: number;
}

export interface DashboardReports {
  monthlySpending: MonthlyAmount[];
  monthlySettlements: MonthlyAmount[];
  topPayers: UserAmount[];
  topDebtors: UserAmount[];
  topCreditors: UserAmount[];
  currencyBreakdown: CurrencyAmount[];
  importStatistics: {
    totalImports: number;
    byStatus: Record<ImportStatus, number>;
    importedRows: number;
    rejectedRows: number;
    anomalyCount: number;
  };
}

export interface MonthlyAmount {
  month: string;
  amount: number;
}

export interface UserAmount {
  userId: string;
  amount: number;
}

export interface CurrencyAmount {
  currency: string;
  amount: number;
}
