export interface BalanceSourceExpense {
  expenseId: string;
  description: string;
  date: string;
  paidById: string;
  participantId: string;
  amountPaid: number;
  amountOwed: number;
}

export interface BalanceSourceSettlement {
  settlementId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  settledAt: string;
}

export interface MemberBalance {
  userId: string;
  totalPaid: number;
  totalOwed: number;
  totalSettledPaid: number;
  totalSettledReceived: number;
  netBalance: number;
  sourceExpenses: BalanceSourceExpense[];
  sourceSettlements: BalanceSourceSettlement[];
}

export interface SettlementSuggestion {
  payerId: string;
  receiverId: string;
  amount: number;
  explanation: {
    reason: string;
    sourceExpenseIds: string[];
    sourceSettlementIds: string[];
  };
}

export interface GroupBalanceResult {
  groupId: string;
  generatedAt: string;
  members: MemberBalance[];
  netBalances: Record<string, number>;
  totalPaid: number;
  totalOwed: number;
  totalSettled: number;
  whoOwesWhom: SettlementSuggestion[];
  metadata: {
    algorithm: "two-pointer-debt-simplification";
    explanation: string;
  };
}
