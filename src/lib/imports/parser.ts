import Papa from "papaparse";
import { badRequest } from "@/lib/api/http";
import type { ParsedImportRow } from "@/lib/imports/types";

const REQUIRED_HEADERS = [
  "date",
  "description",
  "amount",
  "currency",
  "paidBy",
  "participants",
  "splitType",
] as const;

function readCell(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value.trim() : "";
}

export function parseImportCsv(csv: string): ParsedImportRow[] {
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

  const headers = parsed.meta.fields ?? [];
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    badRequest(`CSV missing required headers: ${missingHeaders.join(", ")}`);
  }

  return parsed.data.map((row, index) => ({
    rowNumber: index + 2,
    raw: Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "string" ? value : String(value ?? ""),
      ])
    ),
    date: readCell(row, "date"),
    description: readCell(row, "description"),
    amount: readCell(row, "amount"),
    currency: readCell(row, "currency"),
    paidBy: readCell(row, "paidBy"),
    participants: readCell(row, "participants"),
    splitType: readCell(row, "splitType"),
  }));
}
