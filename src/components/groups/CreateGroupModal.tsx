/**
 * src/components/groups/CreateGroupModal.tsx — Create Group Modal
 *
 * Modal form for creating a new expense group.
 * Uses existing Modal and form primitives.
 * On success: closes modal, invalidates cache, navigates to new group.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateGroup } from "@/lib/hooks/use-groups";
import { useUserPreferences } from "@/lib/hooks/use-preferences";
import { useToast } from "@/components/ui/Toast";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
];

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  const router = useRouter();
  const createGroup = useCreateGroup();
  const { data: prefData } = useUserPreferences();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState(
    prefData?.preferences?.currency ?? "INR"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Group name is required";
    } else if (name.trim().length > 120) {
      newErrors.name = "Group name must be 120 characters or fewer";
    }
    if (description.length > 500) {
      newErrors.description = "Description must be 500 characters or fewer";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        currency,
      });

      toast.success("Group created successfully!");
      // Reset form
      setName("");
      setDescription("");
      onClose();

      // Navigate to the newly created group
      if (result?.group?.id) {
        router.push(`/groups/${result.group.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create group";
      setErrors({ form: message });
    }
  };

  const handleClose = () => {
    if (!createGroup.isPending) {
      setName("");
      setDescription("");
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Group"
      description="Set up a new shared expense group for your team, trip, or household."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g., Weekend Trip to Goa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
          id="create-group-name"
        />

        <Input
          label="Description"
          placeholder="What's this group for? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          id="create-group-description"
        />

        <Select
          label="Default Currency"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          id="create-group-currency"
        />

        {errors.form && (
          <p className="text-xs text-[var(--color-danger-light)]" role="alert">
            {errors.form}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={createGroup.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={createGroup.isPending}
          >
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
