import { SplitType } from "@prisma/client";
import { badRequest } from "@/lib/api/http";
import type { ExpenseParticipantInput } from "@/lib/expenses/validation";

export interface SplitAllocation {
  userId: string;
  rawSplitValue: number | null;
  owedAmount: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sum(values: number[]): number {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

function assertUniqueParticipants(participants: ExpenseParticipantInput[]) {
  const uniqueIds = new Set(participants.map((participant) => participant.userId));
  if (uniqueIds.size !== participants.length) {
    badRequest("Expense participants must be unique");
  }
}

export function calculateSplitAllocations(
  splitType: SplitType,
  amount: number,
  participants: ExpenseParticipantInput[]
): SplitAllocation[] {
  assertUniqueParticipants(participants);

  if (splitType === SplitType.EQUAL) {
    const cents = Math.round(amount * 100);
    const baseCents = Math.floor(cents / participants.length);
    let remainder = cents - baseCents * participants.length;

    return participants.map((participant) => {
      const extraCent = remainder > 0 ? 1 : 0;
      remainder -= extraCent;
      return {
        userId: participant.userId,
        rawSplitValue: null,
        owedAmount: (baseCents + extraCent) / 100,
      };
    });
  }

  if (splitType === SplitType.EXACT) {
    const allocations = participants.map((participant) => {
      if (participant.splitValue === undefined) {
        badRequest("Exact split participants require splitValue");
      }
      return {
        userId: participant.userId,
        rawSplitValue: participant.splitValue,
        owedAmount: participant.splitValue,
      };
    });

    if (sum(allocations.map((allocation) => allocation.owedAmount)) !== amount) {
      badRequest("Exact split values must sum to the expense amount");
    }

    return allocations;
  }

  if (splitType === SplitType.PERCENTAGE) {
    const percentageTotal = sum(
      participants.map((participant) => participant.splitValue ?? 0)
    );
    if (percentageTotal !== 100) {
      badRequest("Percentage split values must sum to 100");
    }

    return participants.map((participant) => {
      if (participant.splitValue === undefined) {
        badRequest("Percentage split participants require splitValue");
      }
      return {
        userId: participant.userId,
        rawSplitValue: participant.splitValue,
        owedAmount: roundMoney(amount * (participant.splitValue / 100)),
      };
    });
  }

  const shareTotal = participants.reduce(
    (total, participant) => total + (participant.splitValue ?? 0),
    0
  );
  if (shareTotal <= 0) {
    badRequest("Share split total must be greater than zero");
  }

  return participants.map((participant) => {
    if (participant.splitValue === undefined || participant.splitValue <= 0) {
      badRequest("Share split participants require positive splitValue");
    }

    return {
      userId: participant.userId,
      rawSplitValue: participant.splitValue,
      owedAmount: roundMoney(amount * (participant.splitValue / shareTotal)),
    };
  });
}
