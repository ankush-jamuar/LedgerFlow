/**
 * src/components/imports/ImportClient.tsx — CSV Upload Center, Session Log & Anomaly Explorer
 */

"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UploadCloud, FileText, AlertCircle, ShieldAlert, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { useGroups } from "@/lib/hooks/use-groups";
import { useGroupImports, useUploadImport, useImportSession } from "@/lib/hooks/use-imports";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import type { ImportSessionResponse } from "@/lib/api/client";
import Papa from "papaparse";

export function ImportClient() {
  const searchParams = useSearchParams();
  const queryGroupId = searchParams ? searchParams.get("groupId") : null;

  const { data: groupsData, isLoading: isGroupsLoading, error: groupsError, refetch: refetchGroups } = useGroups();
  const groups = groupsData?.groups ?? [];

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [inspectSessionId, setInspectSessionId] = useState<string | null>(null);

  const activeGroupId = selectedGroupId || queryGroupId || groups[0]?.id || "";

  // Fetch imports for selected group
  const { data: importsData, isLoading: isImportsLoading, error: importsError, refetch: refetchImports } = useGroupImports(activeGroupId);
  const imports = importsData?.imports ?? [];

  // Fetch detailed session if inspected
  const { data: sessionData, isLoading: isSessionLoading } = useImportSession(inspectSessionId || "");
  const sessionDetail = sessionData?.importSession;

  // Upload mutation
  const uploadMutation = useUploadImport(activeGroupId);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<ImportSessionResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Mapping states
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnSamples, setColumnSamples] = useState<Record<string, string[]>>({});
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const isMappingValid = useMemo(() => {
    const requiredKeys = ["date", "description", "amount", "paidBy", "participants", "splitType"];
    return requiredKeys.every((key) => !!mapping[key]);
  }, [mapping]);

  // Anomaly Filters
  const [anomalySeverity, setAnomalySeverity] = useState("all");
  const [anomalyType, setAnomalyType] = useState("all");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);
    setUploadSuccess(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const suggestClientMapping = (headers: string[]) => {
    const normalizedHeaders = new Map(
      headers.map((h) => [h.trim().toLowerCase().replace(/\s+/g, " "), h])
    );
    const suggested: Record<string, string> = {};

    const HEADER_ALIASES = {
      date: ["date", "transaction date", "paid date"],
      description: ["description", "merchant", "memo", "note"],
      amount: ["amount", "total", "cost", "value"],
      paidBy: ["paidby", "paid by", "payer", "paid_by"],
      participants: ["participants", "members", "split with", "split_with"],
      splitType: ["splittype", "split type", "split_type"],
      currency: ["currency", "currency code", "ccy"],
    };

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      const matched = aliases
        .map((alias) => normalizedHeaders.get(alias.trim().toLowerCase().replace(/\s+/g, " ")))
        .find(Boolean);
      if (matched) {
        suggested[field] = matched;
      }
    }

    return suggested;
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadError("Only CSV files are supported.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File exceeds the 2MB limit.");
      return;
    }
    setSelectedFile(file);

    // Read headers client-side
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      Papa.parse(text, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => {
          const headers = results.meta.fields ?? [];
          setCsvHeaders(headers);

          const samples: Record<string, string[]> = {};
          headers.forEach((h) => {
            samples[h] = results.data
              .map((row) => {
                const record = row as Record<string, unknown>;
                return String(record[h] ?? "");
              })
              .filter(Boolean)
              .slice(0, 3);
          });
          setColumnSamples(samples);

          const suggested = suggestClientMapping(headers);
          setMapping(suggested);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !activeGroupId || !isMappingValid) return;

    setUploadError(null);
    setUploadSuccess(null);
    setSimulatedProgress(10);

    // Simulate upload progress
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    try {
      const response = await uploadMutation.mutateAsync({
        file: selectedFile,
        mapping,
      });
      setSimulatedProgress(100);
      clearInterval(interval);
      setUploadSuccess(response.importSession);
      setSelectedFile(null);
      setCsvHeaders([]);
      setColumnSamples({});
      setMapping({});
      void refetchImports();
    } catch (err) {
      clearInterval(interval);
      setSimulatedProgress(0);
      const message = err instanceof Error ? err.message : "Failed to process import file";
      setUploadError(message);
    }
  };

  // Filter anomalies for selected session
  const filteredAnomalies = useMemo(() => {
    if (!sessionDetail?.anomalies) return [];
    let list = [...sessionDetail.anomalies];

    if (anomalySeverity !== "all") {
      list = list.filter((a) => a.severity === anomalySeverity);
    }
    if (anomalyType !== "all") {
      list = list.filter((a) => a.type === anomalyType);
    }

    return list;
  }, [sessionDetail, anomalySeverity, anomalyType]);

  const uniqueAnomalyTypes = useMemo<string[]>(() => {
    if (!sessionDetail?.anomalies) return [];
    return Array.from(new Set(sessionDetail.anomalies.map((a) => a.type)));
  }, [sessionDetail]);

  const tabs = [
    { id: "upload", label: "Upload CSV" },
    { id: "history", label: "Import History" },
  ];

  if (groupsError || importsError) {
    return (
      <ErrorState
        title="Could not load imports"
        message="An issue occurred connecting to the imports center. Please try again."
        onRetry={() => {
          void refetchGroups();
          void refetchImports();
        }}
      />
    );
  }

  const isLoading = isGroupsLoading || isImportsLoading;

  return (
    <div className="space-y-6">
      {/* Group selector */}
      {!isGroupsLoading && groups.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Import Group:
          </span>
          <select
            value={activeGroupId}
            onChange={(e) => {
              setSelectedGroupId(e.target.value);
              setInspectSessionId(null);
              setUploadSuccess(null);
              setUploadError(null);
              setSelectedFile(null);
            }}
            className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--glass-border)] pb-2">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title="No groups found"
          description="Create or join a group first to import CSV expense registries."
          action={
            <Link href="/groups">
              <Button variant="primary" size="sm">
                Go to Groups
              </Button>
            </Link>
          }
        />
      ) : activeTab === "upload" ? (
        /* Upload Center Tab */
        <div className="max-w-2xl mx-auto space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${dragActive
              ? "border-[var(--color-primary-light)] bg-[var(--color-primary)]/5"
              : "border-[var(--glass-border)] hover:border-white/20 bg-white/[0.01]"
              }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <UploadCloud className="h-10 w-10 text-[var(--color-text-muted)] opacity-60 mb-4" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Drag & Drop expense CSV file here
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-sm leading-relaxed">
              Or click to browse from files. Only CSV format is supported. Max limit 2MB.
            </p>
          </div>

          {selectedFile && (
            <div className="glass rounded-xl p-5 space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-3 min-w-0">
                <FileText className="h-7 w-7 text-[var(--color-primary-light)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Column Mapping Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Configure CSV Column Mapping
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    We mapped some columns automatically. Adjust them to match your CSV file structure.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "date", label: "Date Column", desc: "e.g. 2026-06-12", required: true },
                    { key: "description", label: "Description / Merchant", desc: "e.g. Grocery, Lunch", required: true },
                    { key: "amount", label: "Amount / Total Cost", desc: "e.g. 150.00", required: true },
                    { key: "paidBy", label: "Paid By (User identifier)", desc: "e.g. ankush or user email", required: true },
                    { key: "participants", label: "Participants List", desc: "e.g. ankush, john, amy", required: true },
                    { key: "splitType", label: "Split Strategy Type", desc: "e.g. EQUAL or PERCENTAGE", required: true },
                    { key: "currency", label: "Currency (Optional)", desc: "Defaults to group currency if empty", required: false },
                  ].map((field) => {
                    const isMapped = !!mapping[field.key];
                    const selectedColumn = mapping[field.key] || "";
                    const samples = columnSamples[selectedColumn] ?? [];

                    return (
                      <div key={field.key} className="space-y-1.5 p-3 rounded-lg border border-[var(--glass-border)] bg-white/[0.01]">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                            {field.label} {field.required && <span className="text-[var(--color-danger-light)]">*</span>}
                          </label>
                          {!isMapped && field.required && (
                            <Badge variant="danger" size="sm">Unmapped</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          {field.desc}
                        </p>
                        <select
                          value={selectedColumn}
                          onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                          className="w-full rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] text-xs p-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                        >
                          <option value="">-- Choose Column --</option>
                          {csvHeaders.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                        {isMapped && samples.length > 0 && (
                          <p className="text-[9px] text-[var(--color-text-muted)] truncate mt-1">
                            Samples: {samples.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-4 mt-2">
                <div className="text-[10px] text-[var(--color-text-muted)] max-w-sm">
                  {!isMappingValid && (
                    <span className="text-[var(--color-danger-light)] font-semibold">
                      Please map all required (*) fields before processing.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setCsvHeaders([]);
                      setColumnSamples({});
                      setMapping({});
                    }}
                    disabled={uploadMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUploadSubmit}
                    loading={uploadMutation.isPending}
                    disabled={!isMappingValid}
                  >
                    Process CSV
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Upload progress */}
          {uploadMutation.isPending && simulatedProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
                <span>Parsing and syncing data records...</span>
                <span>{simulatedProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.02]">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                  style={{ width: `${simulatedProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {uploadError && (
            <div className="rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-ghost)] p-4 flex gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-[var(--color-danger-light)] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[var(--color-text-primary)]">Upload failed</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                  {uploadError}
                </p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {uploadSuccess && (
            <div className="rounded-xl border border-[var(--color-success-light)] bg-[var(--color-success-ghost)] p-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--color-success-light)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--color-text-primary)]">CSV imported successfully!</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    File &quot;{uploadSuccess.filename}&quot; processed. Rows analyzed: {uploadSuccess.rowCount}.
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--color-success-light)]/20 pt-3 flex flex-wrap gap-4 text-xs font-medium">
                <div>
                  <span className="text-[var(--color-text-muted)]">Imported Expenses: </span>
                  <span className="text-[var(--color-success-light)]">{uploadSuccess.importedRows ?? uploadSuccess.rowCount - (uploadSuccess.rejectedRows ?? 0)}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Rejected Rows: </span>
                  <span className={(uploadSuccess.rejectedRows ?? 0) > 0 ? "text-[var(--color-danger-light)]" : "text-[var(--color-text-secondary)]"}>
                    {uploadSuccess.rejectedRows ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Anomalies Detected: </span>
                  <span className={(uploadSuccess.anomalyCount ?? 0) > 0 ? "text-[var(--color-warning-light)]" : "text-[var(--color-text-secondary)]"}>
                    {uploadSuccess.anomalyCount ?? 0}
                  </span>
                </div>
              </div>

              {(uploadSuccess.anomalyCount ?? 0) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInspectSessionId(uploadSuccess.id);
                    setActiveTab("history");
                  }}
                  className="mt-1"
                >
                  Explore Anomalies <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}

          {/* CSV File Format Instructions */}
          <div className="glass rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Info className="h-4 w-4 text-[var(--color-primary-light)]" /> CSV Requirements
            </h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Your CSV sheet must contain a header row. LedgerFlow validates rows and flags warnings (anomalies) for duplicates, negative values, and non-registered users.
            </p>
            <div className="bg-black/20 p-2.5 rounded-lg border border-white/[0.02] font-mono text-[10px] text-[var(--color-text-muted)] overflow-x-auto whitespace-nowrap">
              Date,Amount,Currency,Description,Paid By Username,Split Type,Participants<br />
              2026-06-12,85.50,USD,Group Dinner,ankush,EQUAL,&quot;ankush, john, amy&quot;<br />
              2026-06-13,120.00,USD,Cab transfer,john,PERCENTAGE,&quot;ankush:40, john:30, amy:30&quot;
            </div>
          </div>
        </div>
      ) : (
        /* History & Anomaly Explorer Tab */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* History list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Sessions Log ({imports.length})
            </h3>

            {imports.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-xs text-[var(--color-text-muted)]">
                No past CSV imports logged for this group.
              </div>
            ) : (
              <div className="space-y-2">
                {imports.map((session) => {
                  const isInspected = inspectSessionId === session.id;
                  const dateStr = new Date(session.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={session.id}
                      onClick={() => setInspectSessionId(session.id)}
                      className={`glass rounded-xl p-4 cursor-pointer transition-all border text-left flex justify-between items-center gap-3 ${isInspected
                        ? "border-[var(--color-primary-light)] bg-[var(--color-primary)]/5"
                        : "border-[var(--glass-border)] hover:border-white/10"
                        }`}
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {session.filename}
                        </h4>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                          {dateStr} • {session.rowCount} total rows
                        </p>
                        <div className="flex gap-3 text-[10px] font-semibold mt-2.5">
                          <span className="text-[var(--color-success-light)]">+{session.importedRows ?? session.rowCount - (session.rejectedRows ?? 0)}</span>
                          {(session.rejectedRows ?? 0) > 0 && <span className="text-[var(--color-danger-light)]">-{session.rejectedRows}</span>}
                          {(session.anomalyCount ?? 0) > 0 && <span className="text-[var(--color-warning-light)]">!{session.anomalyCount}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            session.status === "COMPLETED"
                              ? "success"
                              : session.status === "PARTIAL"
                                ? "warning"
                                : session.status === "FAILED"
                                  ? "danger"
                                  : "default"
                          }
                          size="sm"
                        >
                          {session.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspected Session Details & Anomaly Explorer */}
          <div className="lg:col-span-3 space-y-6">
            {!inspectSessionId ? (
              <div className="glass rounded-xl p-16 text-center">
                <FileText className="h-8 w-8 text-[var(--color-text-muted)] mx-auto opacity-40 mb-3" />
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">No session selected</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Select an import session log from the list to explore reports, warnings, and processing anomalies.
                </p>
              </div>
            ) : isSessionLoading ? (
              <div className="glass rounded-xl p-6 space-y-4 animate-pulse">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : sessionDetail ? (
              <div className="space-y-6">
                {/* Session outcome overview */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex justify-between gap-4 items-start border-b border-[var(--glass-border)] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                        {sessionDetail.filename}
                      </h3>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        Import Session ID: {sessionDetail.id}
                      </p>
                    </div>
                    <Badge variant={sessionDetail.status === "COMPLETED" ? "success" : sessionDetail.status === "FAILED" ? "danger" : "warning"} size="sm">
                      {sessionDetail.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Total Rows
                      </p>
                      <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                        {sessionDetail.rowCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Imported
                      </p>
                      <p className="text-lg font-bold text-[var(--color-success-light)] mt-1">
                        {sessionDetail.importedRows ?? sessionDetail.rowCount - (sessionDetail.rejectedRows ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Rejected
                      </p>
                      <p className="text-lg font-bold text-[var(--color-danger-light)] mt-1">
                        {sessionDetail.rejectedRows ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Anomalies
                      </p>
                      <p className="text-lg font-bold text-[var(--color-warning-light)] mt-1">
                        {sessionDetail.anomalyCount ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Anomaly Explorer */}
                <div className="glass rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <ShieldAlert className="h-4.5 w-4.5 text-[var(--color-warning-light)]" /> Anomaly Explorer
                    </h3>

                    {/* Filter controls */}
                    <div className="flex gap-2">
                      <select
                        value={anomalySeverity}
                        onChange={(e) => setAnomalySeverity(e.target.value)}
                        className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-xs px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Severities</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>

                      <select
                        value={anomalyType}
                        onChange={(e) => setAnomalyType(e.target.value)}
                        className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-text-primary)] text-xs px-2 py-1 focus:outline-none cursor-pointer max-w-[150px]"
                      >
                        <option value="all">All Types</option>
                        {uniqueAnomalyTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredAnomalies.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--glass-border)] rounded-lg">
                      No anomalies match the selected filters.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAnomalies.map((anomaly) => {
                        const payloadMsg = String(anomaly.payload?.message || "Relational consistency warning");
                        const rowNum =
                          anomaly.payload?.rowNumber !== undefined && anomaly.payload?.rowNumber !== null
                            ? String(anomaly.payload.rowNumber)
                            : undefined;

                        return (
                          <div
                            key={anomaly.id}
                            className="p-3 rounded-lg border border-[var(--glass-border)] bg-white/[0.01] text-xs flex items-start justify-between gap-3 hover:bg-white/[0.02]"
                          >
                            <div className="space-y-1">
                              <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${anomaly.severity === "CRITICAL" || anomaly.severity === "HIGH"
                                  ? "bg-[var(--color-danger-light)]"
                                  : "bg-[var(--color-warning-light)]"
                                  }`} />
                                {anomaly.type.replace(/_/g, " ")}
                              </span>
                              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                {payloadMsg}
                              </p>
                              {rowNum !== undefined && (
                                <p className="text-[10px] text-[var(--color-text-muted)]">
                                  Reference: CSV Row #{rowNum}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 text-right space-y-1">
                              <Badge
                                variant={
                                  anomaly.severity === "CRITICAL" || anomaly.severity === "HIGH"
                                    ? "danger"
                                    : "warning"
                                }
                                size="sm"
                              >
                                {anomaly.severity}
                              </Badge>
                              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                                {anomaly.status}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
