/**
 * src/components/expenses/ExpenseDetailClient.tsx — Expense Detail view client component
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Edit3, Trash2, Calendar, Receipt, Users, ShieldAlert, FileText } from "lucide-react";
import { useExpense, useDeleteExpense } from "@/lib/hooks/use-expenses";
import { useGroupMembers } from "@/lib/hooks/use-groups";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/utils/format-money";
import { EditExpenseModal } from "@/components/expenses/EditExpenseModal";

interface ExpenseDetailClientProps {
  expenseId: string;
}

export function ExpenseDetailClient({ expenseId }: ExpenseDetailClientProps) {
  const router = useRouter();
  const { userId: currentUserId } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch expense data
  const { data: expenseData, isLoading: isExpenseLoading, error: expenseError, refetch } = useExpense(expenseId);
  const expense = expenseData?.expense;

  // Fetch group members to determine roles
  const { data: membersData } = useGroupMembers(expense?.groupId || "");
  const members = membersData?.members ?? [];

  // Delete mutation
  const deleteMutation = useDeleteExpense(expenseId, expense?.groupId || "");

  // Determine current user's role in the group
  const currentUserMembership = members.find((m) => m.userId === currentUserId);
  const canManage =
    currentUserMembership?.role === "OWNER" || currentUserMembership?.role === "ADMIN";

  const handleEditSuccess = () => {
    void refetch();
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      router.push(`/groups/${expense?.groupId}`);
    } catch (err) {
      console.error("Failed to delete expense", err);
    }
  };

  if (isExpenseLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-32 rounded bg-white/5" />
            <div className="h-8 w-64 rounded bg-white/5" />
          </div>
          <div className="h-10 w-24 rounded bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6 animate-pulse">
            <div className="glass h-48 rounded-xl" />
            <div className="glass h-64 rounded-xl" />
          </div>
          <div className="space-y-6 animate-pulse">
            <div className="glass h-32 rounded-xl" />
            <div className="glass h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (expenseError || !expense) {
    return (
      <ErrorState
        title="Expense not found"
        message="The expense record you are trying to view does not exist or you lack authorization."
        onRetry={refetch}
      />
    );
  }

  // Parse strings to numbers for formatting
  const originalAmt = parseFloat(expense.originalAmount);
  const baseAmt = parseFloat(expense.baseAmount);
  const rate = parseFloat(expense.exchangeRate);
  const hasExchangeRate = expense.originalCurrency !== expense.group?.currency && rate !== 1;

  // Find payer name
  const payerName =
    expense.paidBy?.username ||
    expense.paidBy?.email?.split("@")[0] ||
    expense.paidById.slice(0, 8);

  const totalSplitWeight = expense.participants?.reduce((sum, p) => {
    if (expense.splitType === "PERCENTAGE" || expense.splitType === "SHARES") {
      return sum + parseFloat(p.splitValue || "0");
    }
    return sum + 1;
  }, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/groups/${expense.groupId}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Group
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {expense.description}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(expense.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <span>Group: <Link href={`/groups/${expense.groupId}`} className="text-[var(--color-primary-light)] hover:underline font-medium">{expense.group?.name}</Link></span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 className="h-4 w-4" />}
                onClick={() => setShowEditModal(true)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4 text-[var(--color-danger-light)]" />}
                onClick={() => setDeleteConfirm(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {deleteConfirm && (
        <div className="rounded-xl border border-[var(--color-danger-light)] bg-[var(--color-danger-ghost)] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-[var(--color-danger-light)] mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Delete Expense?</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                This action is permanent and will revert all members&apos; balances associated with this expense.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
              className="bg-[var(--color-danger-light)] hover:bg-[var(--color-danger-light)]/80 text-white"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Splits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Financial Details */}
          <div className="glass rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)]/5 rounded-bl-full pointer-events-none" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Amount Details
            </span>
            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                {formatMoney(originalAmt, expense.originalCurrency)}
              </span>
              <Badge variant="default" size="md">
                Split {expense.splitType}
              </Badge>
            </div>

            {hasExchangeRate && (
              <div className="mt-3 text-xs text-[var(--color-text-muted)] flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5 w-fit">
                <span>Base Currency value:</span>
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  {formatMoney(baseAmt, expense.group?.currency || "USD")}
                </span>
                <span>•</span>
                <span>Exchange rate:</span>
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  {rate.toFixed(4)}
                </span>
              </div>
            )}

            <div className="mt-6 border-t border-[var(--glass-border)] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Paid By
                </span>
                <div className="flex items-center gap-2.5 mt-1.5">
                  {expense.paidBy?.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={expense.paidBy.imageUrl}
                      alt={payerName}
                      className="h-7 w-7 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-light)]">
                      {payerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{payerName}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{expense.paidBy?.email || "No email"}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Billing Strategy
                </span>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1.5">
                  {expense.splitType === "EQUAL" && "Shared Equally"}
                  {expense.splitType === "PERCENTAGE" && "Divided by Percentages"}
                  {expense.splitType === "EXACT" && "Assigned Exact Amounts"}
                  {expense.splitType === "SHARES" && "Weighed by Shares"}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  Calculated dynamically across {expense.participants?.length} participants
                </p>
              </div>
            </div>
          </div>

          {/* Split Visualization */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-[var(--color-primary-light)]" /> Split Visualization
            </h2>

            <div className="divide-y divide-[var(--glass-border)]">
              {expense.participants?.map((participant) => {
                const name =
                  participant.user?.username ||
                  participant.user?.email?.split("@")[0] ||
                  participant.userId.slice(0, 8);

                // Calculate exact owed amount
                // The backend metadata stores the calculatedOwedAmount (e.g. participant.metadata?.calculatedOwedAmount)
                // If not available, we fall back to manual calculation for EQUAL, etc.
                const owedAmountStr = participant.metadata?.calculatedOwedAmount;
                const owedAmount =
                  owedAmountStr !== undefined && owedAmountStr !== null
                    ? parseFloat(owedAmountStr.toString())
                    : expense.splitType === "EQUAL"
                    ? baseAmt / (expense.participants?.length || 1)
                    : 0;

                // Relative percentage of split weight for visual progress bar
                let relativeWeight = 0;
                if (expense.splitType === "EQUAL") {
                  relativeWeight = 100 / (expense.participants?.length || 1);
                } else if (expense.splitType === "PERCENTAGE" || expense.splitType === "SHARES") {
                  const val = parseFloat(participant.splitValue || "0");
                  relativeWeight = (val / totalSplitWeight) * 100;
                } else if (expense.splitType === "EXACT") {
                  const val = parseFloat(participant.splitValue || "0");
                  relativeWeight = (val / originalAmt) * 100;
                }

                return (
                  <div key={participant.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center text-sm gap-4 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {participant.user?.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={participant.user.imageUrl}
                            alt={name}
                            className="h-6 w-6 rounded-full object-cover border border-white/5"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[9px] font-bold text-[var(--color-text-secondary)]">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-[var(--color-text-secondary)] truncate">
                          {name}
                          {participant.userId === expense.paidById && (
                            <span className="text-[10px] text-[var(--color-text-muted)] ml-1.5">(Payer)</span>
                          )}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-[var(--color-text-primary)]">
                          {formatMoney(owedAmount, expense.originalCurrency)}
                        </span>
                        {expense.splitType !== "EQUAL" && participant.splitValue && (
                          <span className="text-[10px] text-[var(--color-text-muted)] ml-2">
                            ({expense.splitType === "PERCENTAGE" && `${participant.splitValue}%`}
                            {expense.splitType === "EXACT" && `${expense.originalCurrency} ${participant.splitValue}`}
                            {expense.splitType === "SHARES" && `${participant.splitValue} shares`})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual bar */}
                    <div className="w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.02]">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-full opacity-80"
                        style={{ width: `${Math.min(100, Math.max(0, relativeWeight))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Receipt & Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="glass rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Audit Context
            </h2>

            <div className="space-y-3.5 text-xs text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Record ID</span>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)] bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded select-all">
                  {expense.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <Badge variant={expense.status === "ACTIVE" ? "success" : "default"} size="sm">
                  {expense.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Created At</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {new Date(expense.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {new Date(expense.updatedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Card */}
          <div className="glass rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Receipt className="h-4 w-4" /> Receipt
            </h2>

            {expense.receiptUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[var(--glass-border)] bg-black/20 flex items-center justify-center group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={expense.receiptUrl}
                    alt="Expense receipt"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] rounded-md px-3 py-1.5 text-xs text-white transition-all font-medium"
                    >
                      <FileText className="h-3.5 w-3.5" /> View original
                    </a>
                  </div>
                </div>
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center text-xs text-[var(--color-primary-light)] font-semibold hover:underline block pt-1"
                >
                  Open receipt in new tab
                </a>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--glass-border)] py-8 px-4 text-center">
                <Receipt className="h-7 w-7 text-[var(--color-text-muted)] mx-auto opacity-40 mb-2" />
                <p className="text-xs text-[var(--color-text-muted)] font-medium">No receipt attached</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  You can edit the expense to upload/link a receipt file.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditExpenseModal
          expense={expense}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
