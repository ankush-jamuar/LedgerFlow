/**
 * src/components/groups/GroupSettingsTab.tsx — Group Settings Component
 *
 * Provides group profile configuration, renaming, archiving, base currency modification,
 * and membership management.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Save, AlertOctagon, Archive, ShieldAlert } from "lucide-react";
import { useGroup, useUpdateGroup, useArchiveGroup, useRestoreGroup, useDeleteGroupPermanent } from "@/lib/hooks/use-groups";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface GroupSettingsTabProps {
  groupId: string;
}

export function GroupSettingsTab({ groupId }: GroupSettingsTabProps) {
  const router = useRouter();
  const { userId: currentUserId } = useAuth();
  const { data: groupData, refetch } = useGroup(groupId);
  const updateGroupMutation = useUpdateGroup(groupId);
  const archiveGroupMutation = useArchiveGroup();
  const restoreGroupMutation = useRestoreGroup();
  const deleteGroupMutation = useDeleteGroupPermanent();

  const group = groupData?.group;
  const isOwner = group?.createdById === currentUserId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Sync state once data is loaded
  const [loaded, setLoaded] = useState(false);
  if (group && !loaded) {
    setName(group.name);
    setDescription(group.description ?? "");
    setCurrency(group.currency);
    setLoaded(true);
  }

  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    try {
      await updateGroupMutation.mutateAsync({
        name,
        description: description || undefined,
        currency,
      });
      setStatus("saved");
      refetch();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to update group settings.");
    }
  };

  const handleArchiveGroup = async () => {
    const doubleCheck = window.confirm(
      "Are you absolutely sure you want to archive this group? This will make the ledger read-only."
    );
    if (!doubleCheck) return;

    try {
      await archiveGroupMutation.mutateAsync(groupId);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to archive group.");
    }
  };

  const handleRestoreGroup = async () => {
    const doubleCheck = window.confirm(
      "Are you sure you want to restore this group? This will make the ledger active again."
    );
    if (!doubleCheck) return;

    try {
      await restoreGroupMutation.mutateAsync(groupId);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore group.");
    }
  };

  const handleDeleteGroupPermanent = async () => {
    const firstCheck = window.confirm(
      "WARNING: This will permanently delete this group, its messages, memberships, and logs.\nThis CANNOT be undone. Proceed?"
    );
    if (!firstCheck) return;

    const secondCheck = window.confirm(
      "Are you completely sure? Financial items like expenses and settlements will restrict deletion to protect audit trail history."
    );
    if (!secondCheck) return;

    try {
      await deleteGroupMutation.mutateAsync(groupId);
      router.push("/groups");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Could not delete group. Active expenses or settlements restrict deletion."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
          Group Profile & Details
        </h3>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Group Name
              </span>
              <input
                type="text"
                required
                className="h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Base Currency
              </span>
              <select
                className="h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Description
            </span>
            <textarea
              className="min-h-20 rounded-lg border border-[var(--glass-border)] bg-[var(--color-brand-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateGroupMutation.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-light)] disabled:opacity-60 cursor-pointer"
            >
              <Save className="size-3.5" />
              {updateGroupMutation.isPending ? "Saving..." : "Save Details"}
            </button>
            {status === "saved" && (
              <span className="text-xs text-[var(--color-success)] font-medium">
                Settings saved successfully!
              </span>
            )}
            {status === "error" && (
              <span className="text-xs text-[var(--color-danger)] font-medium">
                {errorMessage}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="glass border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2.5 text-[var(--color-danger-light)] mb-2">
            <AlertOctagon className="size-5" />
            <h3 className="text-sm font-semibold">Danger Zone</h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {group?.isArchived
              ? "This group is currently archived. You can restore access to make it active, or permanently delete the workspace if it has no financial items."
              : "Once archived, no further expenses can be added, updated, or settlements recorded. All memberships are preserved for balance audit trails."}
          </p>
          <div className="flex flex-wrap gap-3">
            {group?.isArchived ? (
              <button
                type="button"
                onClick={handleRestoreGroup}
                disabled={restoreGroupMutation.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 text-xs font-semibold text-emerald-400 transition cursor-pointer"
              >
                Restore Group
              </button>
            ) : (
              <button
                type="button"
                onClick={handleArchiveGroup}
                disabled={archiveGroupMutation.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-4 text-xs font-semibold text-amber-400 transition cursor-pointer"
              >
                Archive Group
              </button>
            )}

            <button
              type="button"
              onClick={handleDeleteGroupPermanent}
              disabled={deleteGroupMutation.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 text-xs font-semibold text-red-400 transition cursor-pointer"
            >
              Permanent Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
