"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { MessageSquare, Send, MessageCircle, AlertCircle, PlusCircle, ArrowLeftRight, Receipt } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useGroups, useGroupMembers } from "@/lib/hooks/use-groups";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export function ChatClient() {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useAuth();
  
  const { data: groupsData, isLoading: isGroupsLoading } = useGroups();
  const groups = groupsData?.groups ?? [];
  
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const activeGroupId = selectedGroupId || groups[0]?.id || "";
  
  const [text, setText] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Autocomplete mentions state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorIndex, setCursorIndex] = useState(0);

  // Fetch group members for autocomplete suggestions
  const { data: membersData } = useGroupMembers(activeGroupId);
  const members = membersData?.members ?? [];

  // Fetch messages
  const { data: chatData, isLoading: isChatLoading } = useQuery({
    queryKey: ["groups", activeGroupId, "messages"],
    queryFn: () => api.groups.messages(activeGroupId),
    enabled: Boolean(activeGroupId),
    refetchInterval: 3000, // Poll every 3 seconds for simple message updates
  });

  const messages = chatData?.messages ?? [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (body: string) => api.groups.sendMessage(activeGroupId, body),
    onSuccess: () => {
      setText("");
      void queryClient.invalidateQueries({ queryKey: ["groups", activeGroupId, "messages"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate(text.trim());
  };

  // Mention autocomplete logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart || 0;
    setText(value);
    setCursorIndex(selectionStart);

    // Look back from cursor to find "@"
    const textBeforeCursor = value.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(" ")) {
      const q = textBeforeCursor.slice(lastAtIdx + 1);
      setMentionQuery(q);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (username: string) => {
    const textBeforeCursor = text.slice(0, cursorIndex);
    const textAfterCursor = text.slice(cursorIndex);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const newText = textBeforeCursor.slice(0, lastAtIdx) + `@${username} ` + textAfterCursor;
      setText(newText);
      setShowMentionSuggestions(false);
    }
  };

  const suggestions = useMemo(() => {
    if (!mentionQuery) return members;
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => {
      const uName = m.user?.username || m.user?.email || "";
      return uName.toLowerCase().includes(q);
    });
  }, [members, mentionQuery]);

  // Scroll to bottom when messages load/change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Date separating helper
  const groupedMessages = useMemo(() => {
    const groups: Array<{ dateLabel: string; items: typeof messages }> = [];
    messages.forEach((msg) => {
      const label = new Date(msg.createdAt).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateLabel === label) {
        lastGroup.items.push(msg);
      } else {
        groups.push({ dateLabel: label, items: [msg] });
      }
    });
    return groups;
  }, [messages]);

  if (isGroupsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No groups found"
        description="Join or create a group to start chatting with members."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)] min-h-[500px]">
      
      {/* Sidebar: Group Selector */}
      <div className="lg:col-span-1 glass rounded-xl p-4 flex flex-col gap-3 h-full overflow-y-auto">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Chat Rooms
        </h3>
        <div className="space-y-1.5">
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                  isActive 
                    ? "bg-[var(--color-primary)] text-white shadow-md" 
                    : "hover:bg-white/[0.03] text-[var(--color-text-secondary)]"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="truncate">{group.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3 glass rounded-xl flex flex-col h-full overflow-hidden border border-[var(--glass-border)] relative">
        
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-[var(--glass-border)] bg-white/[0.01]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            #{groups.find((g) => g.id === activeGroupId)?.name || "Chat Room"}
          </h2>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Messages are shared with all members in the group
          </p>
        </div>

        {/* Message History Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/10">
          {isChatLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3 rounded-xl" />
              <Skeleton className="h-10 w-1/2 rounded-xl" />
              <Skeleton className="h-10 w-3/4 rounded-xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <MessageSquare className="h-8 w-8 text-[var(--color-text-muted)] opacity-30 mb-2" />
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">No messages yet</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Be the first to say hello!</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.dateLabel} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[var(--glass-border)]" />
                  <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {group.dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-[var(--glass-border)]" />
                </div>

                {group.items.map((message) => {
                  const isSelf = message.senderId === currentUserId;
                  const senderName = message.sender?.username || message.sender?.email?.split("@")[0] || "User";
                  const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  // Check if this message is a system message (contains emojis/keywords)
                  const isSystem = message.body.startsWith("💰") || message.body.startsWith("🤝") || message.body.startsWith("📥") || message.body.startsWith("❌") || message.body.startsWith("🔄");

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-[var(--color-text-secondary)] max-w-lg mx-auto">
                        <span className="text-xs">
                          {message.body.split(" ")[0]}
                        </span>
                        <p className="flex-1 truncate">{message.body.substring(2)}</p>
                        <span className="text-[8px] text-[var(--color-text-muted)] shrink-0">{timeStr}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2.5 max-w-[80%] ${
                        isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Sender Avatar */}
                      {!isSelf && (
                        message.sender?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={message.sender.imageUrl}
                            alt={senderName}
                            className="h-7 w-7 rounded-full object-cover border border-white/5 mt-0.5 shrink-0"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-light)] mt-0.5 shrink-0">
                            {senderName.slice(0, 2).toUpperCase()}
                          </div>
                        )
                      )}

                      {/* Message bubble */}
                      <div className="space-y-1">
                        {!isSelf && (
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium pl-1">
                            {senderName}
                          </span>
                        )}
                        <div
                          className={`px-3 py-2 text-xs rounded-2xl ${
                            isSelf
                              ? "bg-[var(--color-primary)] text-white rounded-tr-none"
                              : "bg-white/[0.04] text-[var(--color-text-primary)] border border-white/[0.02] rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed break-words whitespace-pre-wrap">{message.body}</p>
                          <span className={`block text-[9px] text-right mt-1 opacity-60 ${isSelf ? "text-white" : "text-[var(--color-text-muted)]"}`}>
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Mentions Autocomplete suggestions bar */}
        {showMentionSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-14 left-4 z-50 w-64 glass border border-[var(--glass-border)] bg-[var(--color-brand-surface)]/95 rounded-lg shadow-xl p-2 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-2 pb-1 border-b border-[var(--glass-border)]">
              Members
            </p>
            <div className="max-h-32 overflow-y-auto">
              {suggestions.map((m) => {
                const uName = m.user?.username || m.user?.email?.split("@")[0] || "User";
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMention(uName)}
                    className="w-full text-left px-2 py-1.5 text-xs text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded transition-colors block truncate"
                  >
                    @{uName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Composer Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-[var(--glass-border)] flex gap-2 bg-white/[0.01]">
          <input
            type="text"
            placeholder="Type a message (use @ to mention)..."
            value={text}
            onChange={handleInputChange}
            className="flex-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder-[var(--color-text-muted)]"
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!text.trim() || sendMutation.isPending}
            className="shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>

      </div>
    </div>
  );
}
