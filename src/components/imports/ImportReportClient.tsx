/**
 * src/components/imports/ImportReportClient.tsx — Dynamic Report Page for Import Session
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import "./print.css";
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle,
  Plus
} from "lucide-react";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAddGroupMember } from "@/lib/hooks/use-groups";
import { useToast } from "@/components/ui/Toast";

interface ImportReportClientProps {
  importSessionId: string;
}

export function ImportReportClient({ importSessionId }: ImportReportClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<{ id: string; name: string } | null>(null);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["imports", importSessionId],
    queryFn: () => api.imports.get(importSessionId),
    enabled: Boolean(importSessionId),
  });

  const session = data?.importSession;
  const addMemberMutation = useAddGroupMember(session?.groupId || "");

  const handleAddUnknownMember = async (usernameOrEmail: string) => {
    if (!session?.groupId) return;
    try {
      // Find Clerk user by username/email
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(usernameOrEmail)}`);
      if (!res.ok) throw new Error("Search failed");
      interface SearchedUser {
        id: string;
        username: string | null;
        email: string | null;
      }
      const searchData = (await res.json()) as { users?: SearchedUser[] };
      const users = searchData.users || [];
      const user = users.find(
        (u) => u.username === usernameOrEmail || u.email === usernameOrEmail
      );
      
      if (!user) {
        toast.error(`Could not find a LedgerFlow user named "${usernameOrEmail}". Ask them to sign up first!`);
        return;
      }

      await addMemberMutation.mutateAsync({
        userId: user.id,
        role: "MEMBER",
      });

      toast.success(`${usernameOrEmail} has been added to the group. You can now re-process the CSV!`);
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-white/5 rounded" />
          <div className="h-10 w-24 bg-white/5 rounded" />
        </div>
        <div className="glass h-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass h-96 rounded-xl" />
          <div className="glass h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <ErrorState
        title="Session not found"
        message="The import session record you are trying to view does not exist or you lack authorization."
        onRetry={refetch}
      />
    );
  }

  // Parse report metadata or details
  interface ExplanationReport {
    rejectedRowDetails?: Array<{
      rowNumber: number;
      explanations: string[];
      raw?: Record<string, unknown>;
    }>;
    processingTimeMs?: number;
  }

  interface AnomalyRecord {
    id: string;
    type: string;
    severity: string;
    payload?: {
      rowNumber?: number;
      row?: number;
      message?: string;
      rawIdentifier?: string;
    };
  }

  const report = (session.reportJson as unknown as ExplanationReport) || {};
  const metrics = {
    totalRows: session.rowCount || 0,
    importedRows: session.importedRows ?? (session.processedCount - session.errorCount),
    rejectedRows: session.rejectedRows ?? session.errorCount,
    anomalyCount: session.anomalyCount ?? 0,
  };

  const rejectedRowDetails = report.rejectedRowDetails || [];
  const anomalies = (session.anomalies as unknown as AnomalyRecord[]) || [];
  
  // Calculate Rates
  const successRate = metrics.totalRows > 0 ? (metrics.importedRows / metrics.totalRows) * 100 : 0;
  const failureRate = metrics.totalRows > 0 ? (metrics.rejectedRows / metrics.totalRows) * 100 : 0;
  const anomalyRate = metrics.totalRows > 0 ? (metrics.anomalyCount / metrics.totalRows) * 100 : 0;

  const anomalyCountsByType = anomalies.reduce((acc: Record<string, number>, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const durationMs = report.processingTimeMs || 0;

  return (
    <div className="space-y-6">
      {/* Brand Header for PDF/Print representation */}
      <div className="print-brand-header">
        <div>
          <div className="print-brand-title">LedgerFlow</div>
          <div className="text-xs text-gray-500 font-medium">Reconciliation & Audit Trail Report</div>
        </div>
        <div className="print-brand-tagline">
          <div>Group: {session.groupId.slice(0, 8)}</div>
          <div>Report generated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="print-footer">
        Generated by LedgerFlow — Auditable financial tracking simplified. Page 1 of 1.
      </div>

      {/* Back navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/import?groupId=${session.groupId}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Import Center
        </Link>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              import("jspdf").then(({ jsPDF }) => {
                const doc = new jsPDF({
                  orientation: "portrait",
                  unit: "pt",
                  format: "a4"
                });

                // Styling constants
                const primaryColor = [124, 58, 237]; // purple
                const secondaryColor = [31, 41, 55]; // dark slate
                const textColor = [55, 65, 81];
                
                // Helper to add header
                const addHeader = (pageNum: number) => {
                  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                  doc.rect(0, 0, 595, 60, "F");
                  doc.setTextColor(255, 255, 255);
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(16);
                  doc.text("LedgerFlow", 40, 36);
                  doc.setFont("helvetica", "normal");
                  doc.setFontSize(9);
                  doc.text("CSV Ingestion Audit Trail & Anomaly Report", 420, 34);
                  doc.setFontSize(8);
                  doc.text(`Page ${pageNum}`, 540, 48);
                };

                // Helper to add footer
                const addFooter = () => {
                  doc.setDrawColor(229, 231, 235);
                  doc.line(40, 800, 555, 800);
                  doc.setTextColor(156, 163, 175);
                  doc.setFont("helvetica", "normal");
                  doc.setFontSize(8);
                  doc.text("Generated by LedgerFlow — Production Stabilization & Audit System", 40, 815);
                  doc.text(`Timestamp: ${new Date(session.createdAt).toLocaleString()}`, 380, 815);
                };

                let pageCount = 1;
                addHeader(pageCount);

                // Document Title / Metadata
                doc.setTextColor(17, 24, 39);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.text("Ingestion Session Audit Report", 40, 100);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(`Session ID: ${session.id}`, 40, 120);
                doc.text(`Filename: ${session.filename}`, 40, 135);
                doc.text(`Uploaded By: ${session.uploadedBy?.username || session.uploadedBy?.email?.split("@")[0] || "User"}`, 40, 150);
                doc.text(`Processing Speed: ${durationMs}ms`, 40, 165);
                doc.text(`Status: ${session.status}`, 40, 180);

                // Metrics Box
                doc.setFillColor(249, 250, 251);
                doc.rect(40, 200, 515, 80, "F");
                doc.setDrawColor(229, 231, 235);
                doc.rect(40, 200, 515, 80, "S");

                doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text("Ingestion Statistics", 50, 218);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(`Total Rows: ${metrics.totalRows}`, 50, 238);
                doc.text(`Successfully Imported: ${metrics.importedRows} (${successRate.toFixed(1)}%)`, 50, 253);
                doc.text(`Rejected Rows: ${metrics.rejectedRows} (${failureRate.toFixed(1)}%)`, 280, 238);
                doc.text(`Anomalies Flagged: ${metrics.anomalyCount}`, 280, 253);

                // Anomaly type summaries
                let y = 310;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("Anomaly Summary", 40, y);
                y += 20;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                const types = Object.entries(anomalyCountsByType);
                if (types.length === 0) {
                  doc.text("No anomalies or warnings were detected during this ingestion run.", 40, y);
                  y += 20;
                } else {
                  types.forEach(([type, count]) => {
                    doc.text(`• ${type.replace(/_/g, " ")}: ${count} occurrence(s)`, 50, y);
                    y += 15;
                  });
                }

                // Add footer to page 1
                addFooter();

                // Page 2: Anomalies List Detail if exists
                if (anomalies.length > 0) {
                  doc.addPage();
                  pageCount++;
                  addHeader(pageCount);
                  
                  let y2 = 90;
                  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(12);
                  doc.text("Anomaly Ingestion Log Details", 40, y2);
                  y2 += 20;

                  doc.setFont("helvetica", "normal");
                  doc.setFontSize(8);
                  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

                  anomalies.slice(0, 25).forEach((anomaly) => {
                    if (y2 > 750) {
                      addFooter();
                      doc.addPage();
                      pageCount++;
                      addHeader(pageCount);
                      y2 = 90;
                      doc.setFont("helvetica", "normal");
                      doc.setFontSize(8);
                      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                    }
                    const rowNum = anomaly.payload?.rowNumber ?? anomaly.payload?.row;
                    const msg = anomaly.payload?.message || "Reconciliation warning";
                    doc.setFont("helvetica", "bold");
                    doc.text(`[Row #${rowNum ?? "N/A"}] ${anomaly.type}`, 40, y2);
                    doc.setFont("helvetica", "normal");
                    doc.text(`  Severity: ${anomaly.severity} | Message: ${msg}`, 40, y2 + 10);
                    y2 += 25;
                  });

                  addFooter();
                }

                doc.save(`ledgerflow-import-report-${session.id.slice(0, 8)}.pdf`);
              });
            }}
          >
            Download PDF
          </Button>
          <Link href={`/groups/${session.groupId}`}>
            <Button variant="primary" size="sm">
              Go to Group Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Header Info */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-full pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Import Session Log Report
            </span>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              {session.filename}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                {new Date(session.createdAt).toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                Processed in {durationMs > 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs}ms`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={session.status === "COMPLETED" ? "success" : session.status === "FAILED" ? "danger" : "warning"} size="md">
              Status: {session.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Overview Stat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Rows</p>
          <p className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">{metrics.totalRows}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Imported Rows</p>
          <p className="text-2xl font-extrabold text-[var(--color-success-light)] mt-1">{metrics.importedRows}</p>
          <span className="text-[10px] text-[var(--color-text-muted)]">({successRate.toFixed(1)}% success)</span>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Rejected Rows</p>
          <p className="text-2xl font-extrabold text-[var(--color-danger-light)] mt-1">{metrics.rejectedRows}</p>
          <span className="text-[10px] text-[var(--color-text-muted)]">({failureRate.toFixed(1)}% failure)</span>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Anomalies Detected</p>
          <p className="text-2xl font-extrabold text-[var(--color-warning-light)] mt-1">{metrics.anomalyCount}</p>
          <span className="text-[10px] text-[var(--color-text-muted)]">({anomalyRate.toFixed(1)}% anomaly)</span>
        </div>
      </div>

      {/* Grid: Anomaly explorer + Stats break downs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Anomalies & Rejections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">
              Row Actions & Processing Report
            </h3>
            
            {anomalies.length === 0 && rejectedRowDetails.length === 0 && (
              <div className="text-center py-10 border border-dashed border-[var(--glass-border)] rounded-lg text-xs text-[var(--color-text-muted)]">
                No errors or warnings were generated for this import session.
              </div>
            )}

            {/* Anomalies List inside nested scroll container */}
            {anomalies.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-warning-light)]">
                  Anomalies Detected ({anomalies.length})
                </h4>
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                  {anomalies.map((anomaly: AnomalyRecord) => {
                    const rowNum = anomaly.payload?.rowNumber ?? anomaly.payload?.row;
                    const message = anomaly.payload?.message || "Relational verification warning";
                    const isUnknownMember = anomaly.type === "UNKNOWN_MEMBER";
                    const rawIdentifier = anomaly.payload?.rawIdentifier;

                    return (
                      <div 
                        key={anomaly.id} 
                        className="p-4 rounded-lg border border-[var(--glass-border)] bg-white/[0.01] text-xs space-y-2 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${anomaly.severity === "CRITICAL" || anomaly.severity === "HIGH" ? "bg-[var(--color-danger-light)]" : "bg-[var(--color-warning-light)]"}`} />
                              {anomaly.type.replace(/_/g, " ")}
                            </span>
                            <p className="text-[var(--color-text-secondary)]">{message}</p>
                            {rowNum !== undefined && (
                              <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                CSV Row Reference: #{rowNum}
                              </p>
                            )}
                          </div>
                          <Badge variant={anomaly.severity === "CRITICAL" || anomaly.severity === "HIGH" ? "danger" : "warning"} size="sm">
                            {anomaly.severity}
                          </Badge>
                        </div>

                        {/* Actionable fix for UNKNOWN_MEMBER */}
                        {isUnknownMember && rawIdentifier && (
                          <div className="mt-3 p-3 rounded bg-white/[0.02] border border-white/[0.04] space-y-2">
                            <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                              <span className="font-semibold text-[var(--color-warning-light)]">Suggested Resolution:</span> Add <span className="font-mono bg-white/5 px-1 py-0.5 rounded">{rawIdentifier}</span> to this group and re-process the CSV.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAddUnknownMember(rawIdentifier)}
                              loading={addMemberMutation.isPending}
                              className="text-xs h-7 gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add {rawIdentifier} to Group
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Rejected Rows List */}
            {rejectedRowDetails.length > 0 && (
              <div className="space-y-4 mt-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-danger-light)]">
                  Critical Error Rejections ({rejectedRowDetails.length})
                </h4>
                <div className="space-y-3">
                  {rejectedRowDetails.map((rejected, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-lg border border-[var(--color-danger-light)]/20 bg-[var(--color-danger-ghost)] text-xs space-y-2"
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          CSV Row #{rejected.rowNumber}
                        </span>
                        <Badge variant="danger" size="sm">REJECTED</Badge>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[var(--color-text-secondary)]">
                        {rejected.explanations?.map((exp: string, eIdx: number) => (
                          <li key={eIdx}>{exp}</li>
                        ))}
                      </ul>
                      {rejected.raw && (
                        <div className="mt-2 pt-2 border-t border-[var(--color-danger-light)]/10 font-mono text-[10px] text-[var(--color-text-muted)] overflow-x-auto">
                          Raw payload: {JSON.stringify(rejected.raw)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics & Breakdown Summary */}
        <div className="space-y-6">
          
          {/* Breakdown summary */}
          <div className="glass rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--glass-border)] pb-2.5">
              Anomaly Breakdown
            </h3>
            
            {anomalies.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No anomalies registered.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(anomalyCountsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-xs text-[var(--color-text-secondary)]">
                    <span>{type.replace(/_/g, " ")}</span>
                    <Badge variant="warning" size="sm">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit contextual details */}
          <div className="glass rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] border-b border-[var(--glass-border)] pb-2.5">
              Audit Context
            </h3>
            
            <div className="space-y-3.5 text-xs text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Session ID</span>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)] select-all truncate max-w-[140px]" title={session.id}>
                  {session.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded By</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {session.uploadedBy?.username || session.uploadedBy?.email?.split("@")[0] || "User"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <Badge variant={session.status === "COMPLETED" ? "success" : "default"} size="sm">
                  {session.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Analyzed</span>
                <span className="font-medium text-[var(--color-text-primary)]">{metrics.totalRows} rows</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
