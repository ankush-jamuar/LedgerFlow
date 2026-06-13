import type { AnomalyType } from "@prisma/client";
import type {
  ImportAnomalyDraft,
  ImportValidationResult,
  RejectedImportRow,
  ValidImportExpense,
} from "@/lib/imports/types";

export interface ImportReport {
  totalRows: number;
  processedRows: number;
  importedRows: number;
  rejectedRows: number;
  anomalyCount: number;
  anomaliesByType: Record<string, number>;
  totalImportedAmount: number;
  currenciesEncountered: string[];
  createdExpenses: string[];
  createdSettlementsDetected: number;
  processingTimeMs: number;
  rejectedRowDetails: RejectedImportRow[];
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function generateImportReport(input: {
  totalRows: number;
  validation: ImportValidationResult;
  createdExpenseIds: string[];
  processingTimeMs: number;
}): ImportReport {
  const anomaliesByType = input.validation.anomalies.reduce<
    Record<AnomalyType, number>
  >((counts, anomaly: ImportAnomalyDraft) => {
    counts[anomaly.type] = (counts[anomaly.type] ?? 0) + 1;
    return counts;
  }, {} as Record<AnomalyType, number>);

  return {
    totalRows: input.totalRows,
    processedRows: input.validation.validRows.length + input.validation.rejectedRows.length,
    importedRows: input.createdExpenseIds.length,
    rejectedRows: input.validation.rejectedRows.length,
    anomalyCount: input.validation.anomalies.length,
    anomaliesByType,
    totalImportedAmount: roundMoney(
      input.validation.validRows.reduce(
        (total: number, row: ValidImportExpense) => total + row.amount,
        0
      )
    ),
    currenciesEncountered: input.validation.currenciesEncountered,
    createdExpenses: input.createdExpenseIds,
    createdSettlementsDetected: input.validation.settlementLikeRowCount,
    processingTimeMs: input.processingTimeMs,
    rejectedRowDetails: input.validation.rejectedRows,
  };
}
