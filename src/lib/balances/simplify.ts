import type { MemberBalance, SettlementSuggestion } from "@/lib/balances/types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function simplifyDebts(members: MemberBalance[]): SettlementSuggestion[] {
  const debtors = members
    .filter((member) => member.netBalance < 0)
    .map((member) => ({
      userId: member.userId,
      amount: roundMoney(Math.abs(member.netBalance)),
      sourceExpenseIds: member.sourceExpenses.map((source) => source.expenseId),
      sourceSettlementIds: member.sourceSettlements.map(
        (source) => source.settlementId
      ),
    }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = members
    .filter((member) => member.netBalance > 0)
    .map((member) => ({
      userId: member.userId,
      amount: roundMoney(member.netBalance),
      sourceExpenseIds: member.sourceExpenses.map((source) => source.expenseId),
      sourceSettlementIds: member.sourceSettlements.map(
        (source) => source.settlementId
      ),
    }))
    .sort((a, b) => b.amount - a.amount);

  const suggestions: SettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      suggestions.push({
        payerId: debtor.userId,
        receiverId: creditor.userId,
        amount,
        explanation: {
          reason:
            "Debtor negative net balance is matched against creditor positive net balance.",
          sourceExpenseIds: Array.from(
            new Set([...debtor.sourceExpenseIds, ...creditor.sourceExpenseIds])
          ),
          sourceSettlementIds: Array.from(
            new Set([
              ...debtor.sourceSettlementIds,
              ...creditor.sourceSettlementIds,
            ])
          ),
        },
      });
    }

    debtor.amount = roundMoney(debtor.amount - amount);
    creditor.amount = roundMoney(creditor.amount - amount);

    if (debtor.amount === 0) {
      debtorIndex += 1;
    }
    if (creditor.amount === 0) {
      creditorIndex += 1;
    }
  }

  return suggestions;
}
