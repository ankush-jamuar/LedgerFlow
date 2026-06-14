import Papa from "papaparse";
import { badRequest } from "@/lib/api/http";
import type {
  DetectedImportColumn,
  ImportCanonicalField,
  ImportColumnMapping,
  ImportHeaderDetection,
  ParsedImportRow,
} from "@/lib/imports/types";

const REQUIRED_HEADERS = [
  "date",
  "description",
  "amount",
  "paidBy",
  "participants",
  "splitType",
] as const;

const OPTIONAL_HEADERS = ["currency"] as const;
const HEADER_ALIASES: Record<ImportCanonicalField, string[]> = {
  date: ["date", "transaction date", "paid date"],
  description: ["description", "merchant", "memo", "note"],
  amount: ["amount", "total", "cost", "value"],
  paidBy: ["paidby", "paid by", "payer", "paid_by"],
  participants: ["participants", "members", "split with", "split_with"],
  splitType: ["splittype", "split type", "split_type"],
  currency: ["currency", "currency code", "ccy"],
};

function readCell(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

function parseCsvRows(csv: string) {
  if (!csv.trim()) {
    badRequest("CSV content is required");
  }

  const parsed = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    badRequest(
      `CSV parsing failed: ${parsed.errors
        .map((error) => error.message)
        .join("; ")}`
    );
  }

  return parsed;
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function suggestMapping(headers: string[]): ImportColumnMapping {
  const normalizedHeaders = new Map(
    headers.map((header) => [normalizeHeader(header), header])
  );
  const mapping: ImportColumnMapping = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
    ImportCanonicalField,
    string[],
  ][]) {
    const matched = aliases
      .map((alias) => normalizedHeaders.get(normalizeHeader(alias)))
      .find(Boolean);
    if (matched) {
      mapping[field] = matched;
    }
  }

  return mapping;
}

function detectedColumns(
  rows: Record<string, unknown>[],
  headers: string[]
): DetectedImportColumn[] {
  return headers.map((name) => ({
    name,
    sampleValues: rows
      .map((row) => readCell(row, name))
      .filter(Boolean)
      .slice(0, 3),
  }));
}

export function detectImportHeaders(
  csv: string,
  filename = "upload.csv"
): ImportHeaderDetection {
  const parsed = parseCsvRows(csv);
  const headers = parsed.meta.fields ?? [];

  return {
    filename,
    detectedColumns: detectedColumns(parsed.data, headers),
    rowCount: parsed.data.length,
    suggestedMapping: suggestMapping(headers),
    requiredFields: [...REQUIRED_HEADERS],
    optionalFields: [...OPTIONAL_HEADERS],
  };
}

export function parseImportCsv(
  csv: string,
  mapping?: ImportColumnMapping
): ParsedImportRow[] {
  const parsed = parseCsvRows(csv);
  const headers = parsed.meta.fields ?? [];
  const effectiveMapping: ImportColumnMapping = mapping ?? suggestMapping(headers);
  const missingHeaders = REQUIRED_HEADERS.filter((field) => {
    const sourceColumn = effectiveMapping[field];
    return !sourceColumn || !headers.includes(sourceColumn);
  });

  if (missingHeaders.length > 0) {
    badRequest(
      `CSV mapping missing required fields: ${missingHeaders.join(", ")}`
    );
  }

  return parsed.data.map((row, index) => ({
    rowNumber: index + 2,
    raw: Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" ? value : String(value ?? ""),
      ])
    ),
    date: readCell(row, effectiveMapping.date ?? ""),
    description: readCell(row, effectiveMapping.description ?? ""),
    amount: readCell(row, effectiveMapping.amount ?? ""),
    currency: effectiveMapping.currency
      ? readCell(row, effectiveMapping.currency)
      : undefined,
    paidBy: readCell(row, effectiveMapping.paidBy ?? ""),
    participants: readCell(row, effectiveMapping.participants ?? ""),
    splitType: readCell(row, effectiveMapping.splitType ?? ""),
  }));
}
