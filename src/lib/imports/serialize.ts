import { importRowsFromReport } from "@/lib/dashboard/reports";
import type { ImportSessionResponse, GroupMemberUser } from "@/lib/api/client";

type ImportSessionRecord = {
  id: string;
  groupId: string;
  filename: string;
  status: string;
  rowCount: number;
  processedCount: number;
  errorCount: number;
  rawErrors?: unknown;
  reportJson?: unknown;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
  anomalies?: unknown[];
  uploadedBy?: GroupMemberUser;
};

export function serializeImportSession(
  session: ImportSessionRecord
): ImportSessionResponse {
  const counts = importRowsFromReport({
    reportJson: session.reportJson,
    processedCount: session.processedCount,
    errorCount: session.errorCount,
    anomalies: session.anomalies ?? [],
  });

  return {
    id: session.id,
    groupId: session.groupId,
    filename: session.filename,
    status: session.status,
    rowCount: session.rowCount,
    processedCount: session.processedCount,
    errorCount: session.errorCount,
    rawErrors: session.rawErrors as ImportSessionResponse["rawErrors"],
    reportJson: session.reportJson as ImportSessionResponse["reportJson"],
    metadata: session.metadata as ImportSessionResponse["metadata"],
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    importedRows: counts.importedRows,
    rejectedRows: counts.rejectedRows,
    anomalyCount: counts.anomalyCount,
    anomalies: session.anomalies as ImportSessionResponse["anomalies"],
    uploadedBy: session.uploadedBy,
  };
}

