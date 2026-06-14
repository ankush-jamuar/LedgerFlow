/**
 * src/components/settlements/RecordSettlementModal.tsx — Record Settlement Modal
 *
 * Scopes to a group if `groupId` is passed, otherwise lets user select a group.
 * Allows choosing payer, receiver, amount, date, and a brief note,
 * validating inputs before submitting to the backend.
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
import { useToast } from "@/components/ui/Toast";

interface RecordSettlementModalProps {
  groupId?: string; // Optional: Lock to a specific group
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordSettlementModal({
  groupId: initialGroupId,
  open,
  onClose,
  onSuccess,
}: RecordSettlementModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: groupsData } = useGroups();
  const groups = useMemo(() => groupsData?.groups ?? [], [groupsData?.groups]);

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || "");
  const { data: membersData, isLoading: isMembersLoading } = useGroupMembers(selectedGroupId);
  const members = useMemo(() => membersData?.members ?? [], [membersData?.members]);

  const [payerId, setPayerId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
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

  // Set default payer/receiver when selectedGroupId changes, but only once when members load
  const [prevGroupIdForMembers, setPrevGroupIdForMembers] = useState("");
  if (selectedGroupId !== prevGroupIdForMembers && !isMembersLoading && members.length > 0) {
    if (members.length > 1) {
      setPayerId(members[0].userId);
      setReceiverId(members[1].userId);
    } else if (members.length === 1) {
      setPayerId(members[0].userId);
      setReceiverId("");
    } else {
      setPayerId("");
      setReceiverId("");
    }
    setPrevGroupIdForMembers(selectedGroupId);
  }

  const activeGroupOptions = useMemo(() => {
    return groups.map((g) => ({ value: g.id, label: g.name }));
  }, [groups]);

  const memberOptions = useMemo(() => {
    return members.map((m) => {
      const name = m.user?.username || m.user?.email?.split("@")[0] || m.userId.slice(0, 8);
      return { value: m.userId, label: name };
    });
  }, [members]);

  // Mutation to record settlement
  const recordSettlementMutation = useMutation({
    mutationFn: (data: unknown) => api.groups.createSettlement(selectedGroupId, data),
    onSuccess: () => {
      toast.success("Settlement recorded successfully!");
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.settlements(selectedGroupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.balances(selectedGroupId) });
      void queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.timeline(selectedGroupId) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (onSuccess) onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    if (!recordSettlementMutation.isPending) {
      setAmount("");
      setNote("");
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
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }
    if (!payerId) {
      newErrors.payerId = "Payer is required";
    }
    if (!receiverId) {
      newErrors.receiverId = "Receiver is required";
    }
    if (payerId === receiverId) {
      newErrors.receiverId = "Payer and Receiver must be different users";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await recordSettlementMutation.mutateAsync({
        payerId,
        receiverId,
        note: note.trim() || null,
        settledAt: new Date(date).toISOString(),
        originalAmount: parsedAmount,
        originalCurrency: currency,
        exchangeRate: 1,
      });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Failed to record settlement" });
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Record Settlement"
      description="Log a direct payment between members to balance debts."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialGroupId && (
          <Select
            label="Group"
            options={activeGroupOptions}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            error={errors.groupId}
            id="settlement-group"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Who Paid (Payer)"
            options={memberOptions}
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            disabled={isMembersLoading}
            error={errors.payerId}
            id="settlement-payer"
          />

          <Select
            label="Who Received (Receiver)"
            options={memberOptions}
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            disabled={isMembersLoading}
            error={errors.receiverId}
            id="settlement-receiver"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Input
              label="Amount Paid"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              id="settlement-amount"
            />
          </div>
          <Input
            label="Group Currency"
            value={currency}
            disabled
            readOnly
            id="settlement-currency"
          />
        </div>

        <Input
          label="Date of Payment"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          id="settlement-date"
        />

        <Input
          label="Note / Memo (optional)"
          placeholder="e.g., Settled dinner share or GPay transfer"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          id="settlement-note"
        />

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
            disabled={recordSettlementMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={recordSettlementMutation.isPending}
            disabled={isMembersLoading || members.length < 2}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
