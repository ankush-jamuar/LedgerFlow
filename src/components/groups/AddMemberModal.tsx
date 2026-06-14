/**
 * src/components/groups/AddMemberModal.tsx — Invite Group Member Modal
 *
 * Form for adding/inviting a member to the group by searching their username or email.
 * Never exposes Clerk User IDs directly to user-facing inputs.
 */

"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAddGroupMember } from "@/lib/hooks/use-groups";
import { X, Search } from "lucide-react";

interface AddMemberModalProps {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

interface SearchedUser {
  id: string;
  username: string | null;
  email: string | null;
  imageUrl: string | null;
}

const ROLE_OPTIONS = [
  { value: "MEMBER", label: "Member — Standard permissions" },
  { value: "ADMIN", label: "Admin — Manage group settings, add/remove members" },
  { value: "OWNER", label: "Owner — Full administrative control" },
];

export function AddMemberModal({ groupId, open, onClose }: AddMemberModalProps) {
  const addMember = useAddGroupMember(groupId);
  const [role, setRole] = useState("MEMBER");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("Error searching users", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!selectedUser) {
      setErrors({ search: "Please search and select a user to add." });
      return;
    }

    try {
      await addMember.mutateAsync({
        userId: selectedUser.id,
        role,
      });

      // Reset & close
      setSelectedUser(null);
      setSearchQuery("");
      setRole("MEMBER");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add member";
      setErrors({ form: message });
    }
  };

  const handleClose = () => {
    if (!addMember.isPending) {
      setSelectedUser(null);
      setSearchQuery("");
      setRole("MEMBER");
      setErrors({});
      onClose();
    }
  };

  const handleSelectUser = (user: SearchedUser) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setErrors({});
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Group Member"
      description="Invite a member by searching for their LedgerFlow username or email address."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedUser ? (
          // Selected user profile card
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Selected Member
            </label>
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-success-light)]/30 bg-[var(--color-success-ghost)] text-sm">
              <div className="flex items-center gap-3 min-w-0">
                {selectedUser.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedUser.imageUrl}
                    alt={selectedUser.username || "User"}
                    className="h-9 w-9 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                    {(selectedUser.username || selectedUser.email || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] truncate">
                    {selectedUser.username || "No username"}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {selectedUser.email || "No email"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="p-1 rounded-md hover:bg-white/5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Change user"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          // Search box & Dropdown suggestions list
          <div className="relative space-y-1.5">
            <Input
              label="Search User"
              placeholder="Enter username or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setSearchResults([]);
                }
              }}
              error={errors.search}
              autoFocus
              id="add-member-search"
              leftIcon={<Search className="h-4 w-4 text-[var(--color-text-muted)]" />}
            />
            {isSearching && (
              <div className="absolute right-3 top-[38px] flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              </div>
            )}

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-[var(--glass-border)] bg-[#121318] backdrop-blur-md shadow-xl py-1.5 divide-y divide-white/[0.04]">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left p-2.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors"
                  >
                    {user.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.imageUrl}
                        alt={user.username || "User"}
                        className="h-8 w-8 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                        {(user.username || user.email || "U").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {user.username || "No username"}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {user.email || "No email"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty search results state */}
            {searchQuery.trim() !== "" && !isSearching && searchResults.length === 0 && (
              <div className="absolute z-50 w-full mt-1 p-4 rounded-lg border border-[var(--glass-border)] bg-[#121318] text-center text-xs text-[var(--color-text-muted)]">
                No matching users found.
              </div>
            )}
          </div>
        )}

        <Select
          label="Group Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          id="add-member-role"
        />

        {errors.form && (
          <p className="text-xs text-[var(--color-danger-light)] font-medium font-mono border border-[var(--color-danger-light)]/20 bg-[var(--color-danger-ghost)] rounded p-2.5" role="alert">
            {errors.form}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={addMember.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={addMember.isPending}
            disabled={!selectedUser}
          >
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
