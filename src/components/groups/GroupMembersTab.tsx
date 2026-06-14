/**
 * src/components/groups/GroupMembersTab.tsx — Group Members Tab
 *
 * Displays active and inactive members with roles and join dates.
 * Allows admins/owners to add members, change roles, or remove members.
 */

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { UserPlus, Shield, Crown, User, Trash2 } from "lucide-react";
import {
  useGroupMembers,
  useChangeGroupMemberRole,
  useRemoveGroupMember,
} from "@/lib/hooks/use-groups";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonRow } from "@/components/ui/Skeleton";

interface GroupMembersTabProps {
  groupId: string;
  onAddMember?: () => void;
}

const ROLE_CONFIG = {
  OWNER: { label: "Owner", variant: "warning" as const, icon: Crown },
  ADMIN: { label: "Admin", variant: "primary" as const, icon: Shield },
  MEMBER: { label: "Member", variant: "default" as const, icon: User },
};

export function GroupMembersTab({ groupId, onAddMember }: GroupMembersTabProps) {
  const { userId: currentUserId } = useAuth();
  const { data, isLoading, error, refetch } = useGroupMembers(groupId);
  const changeRoleMutation = useChangeGroupMemberRole(groupId);
  const removeMemberMutation = useRemoveGroupMember(groupId);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (error) {
    return (
      <ErrorState
        title="Could not load members"
        message="Failed to load group members. Please try again."
        onRetry={() => refetch()}
        size="sm"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  const members = data?.members ?? [];
  const activeMembers = members.filter((m) => m.isActive);
  const inactiveMembers = members.filter((m) => !m.isActive);

  // Determine permissions
  const currentUserMembership = members.find((m) => m.userId === currentUserId);
  const isActorAdminOrOwner =
    currentUserMembership?.role === "ADMIN" ||
    currentUserMembership?.role === "OWNER";

  const handleRoleChange = async (userId: string, newRole: string) => {
    setErrorText(null);
    try {
      await changeRoleMutation.mutateAsync({ userId, role: newRole });
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this member from the group?")) {
      return;
    }
    setErrorText(null);
    try {
      await removeMemberMutation.mutateAsync(userId);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No members"
        description="Invite members to start sharing expenses in this group."
        size="sm"
        action={
          onAddMember && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={onAddMember}
            >
              Add Member
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {errorText && (
        <div className="rounded-lg bg-[var(--color-danger-ghost)] border border-[var(--color-danger-light)] p-3 text-xs text-[var(--color-danger-light)] font-medium">
          {errorText}
        </div>
      )}

      {/* Active members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            Active Members ({activeMembers.length})
          </h3>
          {isActorAdminOrOwner && onAddMember && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<UserPlus className="h-3 w-3" />}
              onClick={onAddMember}
              id="add-member-inline-btn"
            >
              Invite Member
            </Button>
          )}
        </div>
        <div className="glass rounded-xl overflow-hidden">
          {activeMembers.map((member, index) => {
            const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;
            const displayName =
              member.user?.username ||
              member.user?.email?.split("@")[0] ||
              member.userId.slice(0, 8);
            const initial = (
              member.user?.email?.[0] ||
              member.user?.username?.[0] ||
              "?"
            ).toUpperCase();

            const isSelf = member.userId === currentUserId;
            const canManageRole =
              isActorAdminOrOwner &&
              !isSelf &&
              (currentUserMembership?.role === "OWNER" || member.role !== "OWNER");

            const canRemove =
              isActorAdminOrOwner &&
              !isSelf &&
              (currentUserMembership?.role === "OWNER" || member.role !== "OWNER");

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-ghost)] text-sm font-semibold text-[var(--color-primary-light)] flex-shrink-0">
                  {initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {displayName} {isSelf && <span className="text-[10px] text-[var(--color-text-muted)]">(You)</span>}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                    {member.user?.email || "No email"}
                  </p>
                </div>

                {/* Role dropdown/badge */}
                <div className="flex items-center gap-3">
                  {canManageRole ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      className="text-xs bg-white/[0.04] border border-[var(--glass-border)] rounded-md text-[var(--color-text-primary)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                      disabled={changeRoleMutation.isPending}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  ) : (
                    <Badge variant={role.variant} size="sm">
                      {role.label}
                    </Badge>
                  )}

                  {/* Joined date */}
                  <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:block w-20 text-right">
                    {new Date(member.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  {/* Remove button */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-danger-light)] p-1 transition-colors cursor-pointer"
                      title="Remove member"
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
            Former Members ({inactiveMembers.length})
          </h3>
          <div className="glass rounded-xl overflow-hidden opacity-60">
            {inactiveMembers.map((member) => {
              const displayName =
                member.user?.username ||
                member.user?.email?.split("@")[0] ||
                member.userId.slice(0, 8);
              const initial = (
                member.user?.email?.[0] ||
                member.user?.username?.[0] ||
                "?"
              ).toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)] last:border-0"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-sm font-semibold text-[var(--color-text-muted)] flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Left{" "}
                      {member.leftAt
                        ? new Date(member.leftAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <Badge variant="outline" size="sm">
                    Left
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
