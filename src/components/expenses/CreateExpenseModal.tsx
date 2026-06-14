/**
 * src/components/expenses/CreateExpenseModal.tsx — Create Expense Modal
 *
 * Scopes to a group if `groupId` is passed, otherwise lets user select a group.
 * Fetches group members, enables Equal, Exact, Percentage, and Shares splits,
 * and validates inputs before submitting to the backend.
 */

"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useGroups, useGroupMembers, GROUP_QUERY_KEYS } from "@/lib/hooks/use-groups";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

interface CreateExpenseModalProps {
  groupId?: string; // Optional: Lock to a specific group
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SPLIT_TYPES = [
  { value: "EQUAL", label: "Split Equally" },
  { value: "EXACT", label: "Exact Amounts" },
  { value: "PERCENTAGE", label: "Percentages" },
  { value: "SHARES", label: "Shares / Weight" },
];

export function CreateExpenseModal({
  groupId: initialGroupId,
  open,
  onClose,
  onSuccess,
}: CreateExpenseModalProps) {
  const queryClient = useQueryClient();
  const { data: groupsData } = useGroups();
  const groups = useMemo(() => groupsData?.groups ?? [], [groupsData?.groups]);

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || "");
  const { data: membersData, isLoading: isMembersLoading } = useGroupMembers(selectedGroupId);
  const members = useMemo(() => membersData?.members ?? [], [membersData?.members]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paidById, setPaidById] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");
  const [receiptUrl, setReceiptUrl] = useState("");

  // Track participating members and their custom values
  // userId -> boolean
  const [participantsCheck, setParticipantsCheck] = useState<Record<string, boolean>>({});
  // userId -> string (raw input values for exact/percentage/shares)
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync initial groupId
  const [prevInitialGroupId, setPrevInitialGroupId] = useState(initialGroupId);
  if (initialGroupId !== prevInitialGroupId) {
    setSelectedGroupId(initialGroupId || "");
    setPrevInitialGroupId(initialGroupId);
  }

  // Set default currency when group changes
  const [prevSelectedGroupId, setPrevSelectedGroupId] = useState(selectedGroupId);
  if (selectedGroupId !== prevSelectedGroupId) {
    const activeGroup = groups.find((g) => g.id === selectedGroupId);
    if (activeGroup) {
      setCurrency(activeGroup.currency);
    }
    setPrevSelectedGroupId(selectedGroupId);
  }

  // Set default paidById and check all members when members load
  const [prevMembers, setPrevMembers] = useState(members);
  if (members !== prevMembers) {
    if (members.length > 0) {
      // Find an owner or admin to default as payer, or first member
      const defaultPayer = members.find((m) => m.role === "OWNER" || m.role === "ADMIN") || members[0];
      setPaidById(defaultPayer.userId);

      // Check all by default
      const checks: Record<string, boolean> = {};
      const vals: Record<string, string> = {};
      members.forEach((m) => {
        checks[m.userId] = true;
        vals[m.userId] = "";
      });
      setParticipantsCheck(checks);
      setSplitValues(vals);
    }
    setPrevMembers(members);
  }

  const activeGroupOptions = useMemo(() => {
    return groups.map((g) => ({ value: g.id, label: g.name }));
  }, [groups]);

  const payerOptions = useMemo(() => {
    return members.map((m) => {
      const name = m.user?.username || m.user?.email?.split("@")[0] || m.userId.slice(0, 8);
      return { value: m.userId, label: name };
    });
  }, [members]);

  const checkedUserIds = useMemo(() => {
    return Object.keys(participantsCheck).filter((id) => participantsCheck[id]);
  }, [participantsCheck]);

  // Mutation to create expense
  const createExpenseMutation = useMutation({
    mutationFn: (data: unknown) => api.groups.createExpense(selectedGroupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.expenses(selectedGroupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.balances(selectedGroupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(selectedGroupId) });
      if (onSuccess) onSuccess();
      handleClose();
    },
  });

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.userId === userId);
    return member?.user?.username || member?.user?.email?.split("@")[0] || userId.slice(0, 8);
  };

  const handleClose = () => {
    if (!createExpenseMutation.isPending) {
      setDescription("");
      setAmount("");
      setSplitType("EQUAL");
      setReceiptUrl("");
      setErrors({});
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!selectedGroupId) {
      newErrors.groupId = "Please select a group";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }
    if (!paidById) {
      newErrors.paidById = "Payer is required";
    }
    if (checkedUserIds.length === 0) {
      newErrors.participants = "At least one participant must be selected";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare participants payloads
    const participantsPayload: { userId: string; splitValue?: number }[] = [];

    if (splitType === "EQUAL") {
      checkedUserIds.forEach((id) => {
        participantsPayload.push({ userId: id });
      });
    } else if (splitType === "PERCENTAGE") {
      let sum = 0;
      for (const id of checkedUserIds) {
        const pct = parseFloat(splitValues[id] || "0");
        if (isNaN(pct) || pct <= 0) {
          newErrors.splitValues = "Percentage must be greater than zero";
          setErrors(newErrors);
          return;
        }
        sum += pct;
        participantsPayload.push({ userId: id, splitValue: pct });
      }
      if (Math.abs(sum - 100) > 0.01) {
        newErrors.splitValues = `Total percentage must equal 100% (currently ${sum}%)`;
        setErrors(newErrors);
        return;
      }
    } else if (splitType === "EXACT") {
      let sum = 0;
      for (const id of checkedUserIds) {
        const val = parseFloat(splitValues[id] || "0");
        if (isNaN(val) || val <= 0) {
          newErrors.splitValues = "Exact amount must be greater than zero";
          setErrors(newErrors);
          return;
        }
        sum += val;
        participantsPayload.push({ userId: id, splitValue: val });
      }
      if (Math.abs(sum - parsedAmount) > 0.01) {
        newErrors.splitValues = `Total splits must equal expense amount ${currency} ${parsedAmount} (currently ${currency} ${sum})`;
        setErrors(newErrors);
        return;
      }
    } else if (splitType === "SHARES") {
      for (const id of checkedUserIds) {
        const val = parseInt(splitValues[id] || "0", 10);
        if (isNaN(val) || val <= 0) {
          newErrors.splitValues = "Shares count must be a positive integer";
          setErrors(newErrors);
          return;
        }
        participantsPayload.push({ userId: id, splitValue: val });
      }
    }

    try {
      await createExpenseMutation.mutateAsync({
        paidById,
        splitType,
        description: description.trim(),
        date: new Date(date).toISOString(),
        originalAmount: parsedAmount,
        originalCurrency: currency,
        exchangeRate: 1,
        participants: participantsPayload,
        receiptUrl: receiptUrl.trim() || null,
      });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Failed to create expense" });
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Expense"
      description="Record a new expense to divide among group members."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {!initialGroupId && (
              <Select
                label="Group"
                options={activeGroupOptions}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                error={errors.groupId}
                id="expense-group"
              />
            )}

            <Input
              label="Description / Title"
              placeholder="e.g., Dinner at Taj or Grocery shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              id="expense-description"
            />

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  error={errors.amount}
                  id="expense-amount"
                />
              </div>
              <Input
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={3}
                id="expense-currency"
              />
            </div>

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              id="expense-date"
            />

            <Select
              label="Paid By"
              options={payerOptions}
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              disabled={isMembersLoading}
              error={errors.paidById}
              id="expense-paid-by"
            />

            <Select
              label="Split Type"
              options={SPLIT_TYPES}
              value={splitType}
              onChange={(e) => {
                setSplitType(e.target.value);
                setErrors({});
              }}
              id="expense-split-type"
            />

            <Input
              label="Receipt Image URL (optional)"
              placeholder="e.g., https://receipts.com/123.jpg"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              id="expense-receipt"
            />
          </div>

          {/* Splits and Participants Section */}
          <div className="border-t md:border-t-0 md:border-l border-[var(--glass-border)] pt-4 md:pt-0 md:pl-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Participants
              </span>
              {errors.participants && (
                <span className="text-xs text-[var(--color-danger-light)]">{errors.participants}</span>
              )}
            </div>

            {isMembersLoading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-full bg-white/[0.04] rounded shimmer" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                Select a group to see members.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {members.map((member) => {
                  const isChecked = !!participantsCheck[member.userId];
                  const value = splitValues[member.userId] || "";

                  return (
                    <div key={member.userId} className="flex items-center gap-3 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setParticipantsCheck({
                            ...participantsCheck,
                            [member.userId]: e.target.checked,
                          });
                        }}
                        className="rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer h-4 w-4"
                      />
                      <span className="flex-1 truncate font-medium text-[var(--color-text-secondary)]">
                        {getMemberName(member.userId)}
                      </span>

                      {isChecked && splitType !== "EQUAL" && (
                        <div className="w-24">
                          <input
                            type="number"
                            step={splitType === "EXACT" ? "0.01" : "1"}
                            placeholder={
                              splitType === "PERCENTAGE"
                                ? "%"
                                : splitType === "EXACT"
                                ? "0.00"
                                : "Shares"
                            }
                            value={value}
                            onChange={(e) => {
                              setSplitValues({
                                ...splitValues,
                                [member.userId]: e.target.value,
                              });
                            }}
                            className="w-full text-right rounded-md border border-[var(--glass-border)] bg-white/[0.02] text-xs px-2 py-1 text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {errors.splitValues && (
              <div className="rounded bg-[var(--color-danger-ghost)] border border-[var(--color-danger-light)] p-2 text-xs text-[var(--color-danger-light)] font-medium">
                {errors.splitValues}
              </div>
            )}
          </div>
        </div>

        {errors.form && (
          <p className="text-xs text-[var(--color-danger-light)] font-medium" role="alert">
            {errors.form}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--glass-border)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={createExpenseMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={createExpenseMutation.isPending}
            disabled={isMembersLoading || members.length === 0}
          >
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
