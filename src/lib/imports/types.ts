import type { AnomalySeverity, AnomalyType, SplitType } from "@prisma/client";

export interface ImportUploadInput {
  groupId: string;
  filename: string;
  csv: string;
  mapping?: ImportColumnMapping;
}

export type ImportCanonicalField =
  | "date"
  | "description"
  | "amount"
  | "paidBy"
  | "participants"
  | "splitType"
  | "currency";

export type ImportColumnMapping = Partial<Record<ImportCanonicalField, string>>;

export interface DetectedImportColumn {
  name: string;
  sampleValues: string[];
}

export interface ImportHeaderDetection {
  filename: string;
  detectedColumns: DetectedImportColumn[];
  rowCount: number;
  suggestedMapping: ImportColumnMapping;
  requiredFields: ImportCanonicalField[];
  optionalFields: ImportCanonicalField[];
}

export interface ParsedImportRow {
  rowNumber: number;
  raw: Record<string, string>;
  date: string;
  description: string;
  amount: string;
  currency?: string;
  paidBy: string;
  participants: string;
  splitType: string;
}

export interface ResolvedParticipant {
  userId: string;
  splitValue?: number;
  rawIdentifier: string;
}

export interface ValidImportExpense {
  rowNumber: number;
  raw: Record<string, string>;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  paidById: string;
  paidByRaw: string;
  splitType: SplitType;
  participants: ResolvedParticipant[];
}

export interface ImportAnomalyDraft {
  rowNumber: number;
  type: AnomalyType;
  severity: AnomalySeverity;
  message: string;
  payload: Record<string, unknown>;
  existingExpenseId?: string;
}

export interface RejectedImportRow {
  rowNumber: number;
  raw: Record<string, string>;
  explanations: string[];
  anomalyTypes: AnomalyType[];
}

export interface ImportValidationResult {
  validRows: ValidImportExpense[];
  rejectedRows: RejectedImportRow[];
  anomalies: ImportAnomalyDraft[];
  currenciesEncountered: string[];
  settlementLikeRowCount: number;
}
