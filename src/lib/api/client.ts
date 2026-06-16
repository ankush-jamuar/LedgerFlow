/**
 * src/lib/api/client.ts — Type-Safe API Client
 *
 * Centralised fetch layer for all LedgerFlow API endpoints.
 * Uses the browser's native fetch with Clerk session tokens.
 *
 * Rules:
 *  - Never use mock data
 *  - Never invent financial values
 *  - Every endpoint must match the actual route in src/app/api/
 *  - Response shapes are inferred from the backend service types
 */

import type { DashboardOverview, DashboardAnomalyOverview, DashboardReports } from "@/lib/dashboard/types";

// ────────────────────────────────────────────────────────────
// Core fetch utility
// ────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let code = "API_ERROR";
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { error?: string; code?: string };
      message = body.error ?? message;
      code = body.code ?? code;
    } catch { /* ignore parse errors */ }
    throw new ApiError(res.status, code, message);
  }

  return res.json() as Promise<T>;
}

// ────────────────────────────────────────────────────────────
// Response shape types (inferred from backend API routes)
// ────────────────────────────────────────────────────────────

export interface GroupMemberUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  imageUrl: string | null;
}

export interface GroupMembership {
  id: string;
  userId: string;
  groupId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  user: GroupMemberUser;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  currency: string;
  isArchived: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  memberships: GroupMembership[];
}

export interface MemberResponse {
  id: string;
  userId: string;
  groupId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  user?: GroupMemberUser;
}

export interface ExpenseParticipantResponse {
  id: string;
  expenseId: string;
  userId: string;
  splitValue: string | null;
  isPaid: boolean;
  user: GroupMemberUser;
  metadata?: Record<string, unknown> | null;
}

export interface ExpenseResponse {
  id: string;
  groupId: string;
  paidById: string;
  description: string;
  originalAmount: string;
  originalCurrency: string;
  baseAmount: string;
  exchangeRate: string;
  date: string;
  splitType: string;
  status: string;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  paidBy?: GroupMemberUser;
  group?: { id: string; name: string; currency: string };
  participants?: ExpenseParticipantResponse[];
}

export interface SettlementResponse {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  originalAmount: string;
  originalCurrency: string;
  baseAmount: string;
  exchangeRate: string;
  note: string | null;
  settledAt: string;
  createdAt: string;
  updatedAt: string;
  payer?: GroupMemberUser;
  receiver?: GroupMemberUser;
  group?: { id: string; name: string; currency: string };
}

export interface BalanceSourceExpense {
  expenseId: string;
  description: string | null;
  date: string;
  paidById: string;
  participantId: string;
  amountPaid: number;
  amountOwed: number;
}

export interface BalanceSourceSettlement {
  settlementId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  settledAt: string;
}

export interface MemberBalance {
  userId: string;
  totalPaid: number;
  totalOwed: number;
  totalSettledPaid: number;
  totalSettledReceived: number;
  netBalance: number;
  sourceExpenses: BalanceSourceExpense[];
  sourceSettlements: BalanceSourceSettlement[];
}

export interface SettlementSuggestion {
  payerId: string;
  receiverId: string;
  amount: number;
}

export interface GroupBalanceResponse {
  groupId: string;
  generatedAt: string;
  members: MemberBalance[];
  netBalances: Record<string, number>;
  totalPaid: number;
  totalOwed: number;
  totalSettled: number;
  whoOwesWhom: SettlementSuggestion[];
}

export interface AnomalyResponse {
  id: string;
  importSessionId: string;
  expenseId: string | null;
  type: string;
  severity: string;
  status: string;
  payload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSessionResponse {
  id: string;
  groupId: string;
  filename: string;
  status: string;
  rowCount: number;
  processedCount: number;
  errorCount: number;
  rawErrors?: Record<string, unknown> | null;
  reportJson?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  anomalies?: AnomalyResponse[];
  importedRows?: number;
  rejectedRows?: number;
  anomalyCount?: number;
  uploadedBy?: GroupMemberUser;
}


export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface TimelineEventResponse {
  id: string;
  type: "joined" | "left" | "role_changed";
  userId: string;
  userName: string;
  role: string;
  fromRole?: string;
  date: string;
  user?: GroupMemberUser;
}

export interface MessageResponse {
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: GroupMemberUser;
}

export interface ActivityItem {
  id: string;
  action: string;
  actorId: string;
  targetId: string | null;
  groupId: string | null;
  payload: unknown;
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// API Namespace
// ────────────────────────────────────────────────────────────

export const api = {
  // ── Dashboard ──────────────────────────────────────────
  dashboard: {
    overview: (currency = "INR") =>
      apiFetch<DashboardOverview>(`/api/dashboard/overview?currency=${currency}`),

    activity: () =>

      apiFetch<{ activities: ActivityItem[] }>("/api/dashboard/activity"),

    anomalies: () =>
      apiFetch<DashboardAnomalyOverview>("/api/dashboard/anomalies"),

    reports: (currency = "INR") =>
      apiFetch<DashboardReports>(`/api/dashboard/reports?currency=${currency}`),


    groups: () =>
      apiFetch<unknown>("/api/dashboard/groups"),

    expenses: () =>
      apiFetch<unknown>("/api/dashboard/expenses"),

    settlements: () =>
      apiFetch<unknown>("/api/dashboard/settlements"),

    imports: () =>
      apiFetch<unknown>("/api/dashboard/imports"),
  },

  // ── Groups ─────────────────────────────────────────────
  groups: {
    list: (includeArchived = false) =>
      apiFetch<{ groups: GroupResponse[] }>(`/api/groups?includeArchived=${includeArchived}`),

    get: (groupId: string) =>
      apiFetch<{ group: GroupResponse }>(`/api/groups/${groupId}`),

    create: (data: { name: string; description?: string; currency?: string }) =>
      apiFetch<{ group: GroupResponse }>("/api/groups", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (groupId: string, data: { name?: string; description?: string; currency?: string }) =>
      apiFetch<{ group: GroupResponse }>(`/api/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    archive: (groupId: string) =>
      apiFetch<{ group: GroupResponse }>(`/api/groups/${groupId}`, {
        method: "DELETE",
      }),

    restore: (groupId: string) =>
      apiFetch<{ group: GroupResponse }>(`/api/groups/${groupId}/restore`, {
        method: "POST",
      }),

    deletePermanent: (groupId: string) =>
      apiFetch<{ success: boolean }>(`/api/groups/${groupId}/permanent-delete`, {
        method: "DELETE",
      }),

    members: (groupId: string) =>
      apiFetch<{ members: MemberResponse[] }>(`/api/groups/${groupId}/members`),

    addMember: (groupId: string, data: { userId: string; role?: string }) =>
      apiFetch<{ member: MemberResponse }>(`/api/groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    changeMemberRole: (groupId: string, userId: string, data: { role: string }) =>
      apiFetch<{ member: MemberResponse }>(`/api/groups/${groupId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    removeMember: (groupId: string, userId: string) =>
      apiFetch<{ member: MemberResponse }>(`/api/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
      }),

    expenses: (groupId: string) =>
      apiFetch<{ expenses: ExpenseResponse[] }>(`/api/groups/${groupId}/expenses`),

    createExpense: (groupId: string, data: unknown) =>
      apiFetch<{ expense: ExpenseResponse }>(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    settlements: (groupId: string) =>
      apiFetch<{ settlements: SettlementResponse[] }>(`/api/groups/${groupId}/settlements`),

    createSettlement: (groupId: string, data: unknown) =>
      apiFetch<{ settlement: SettlementResponse }>(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    balances: (groupId: string) =>
      apiFetch<{ balances: GroupBalanceResponse }>(`/api/groups/${groupId}/balances`),

    timeline: (groupId: string) =>
      apiFetch<{ timelineEvents: TimelineEventResponse[] }>(`/api/groups/${groupId}/timeline`),

    imports: (groupId: string) =>
      apiFetch<{ imports: ImportSessionResponse[] }>(`/api/groups/${groupId}/imports`),

    messages: (groupId: string) =>
      apiFetch<{ messages: MessageResponse[] }>(`/api/groups/${groupId}/messages`),

    sendMessage: (groupId: string, body: string) =>
      apiFetch<{ message: MessageResponse }>(`/api/groups/${groupId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
  },


  // ── Expenses ───────────────────────────────────────────
  expenses: {
    get: (expenseId: string) =>
      apiFetch<{ expense: ExpenseResponse }>(`/api/expenses/${expenseId}`),

    update: (expenseId: string, data: unknown) =>
      apiFetch<{ expense: ExpenseResponse }>(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (expenseId: string) =>
      apiFetch<{ expense: ExpenseResponse }>(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      }),
  },

  // ── Settlements ────────────────────────────────────────
  settlements: {
    get: (settlementId: string) =>
      apiFetch<{ settlement: SettlementResponse }>(`/api/settlements/${settlementId}`),
  },

  // ── Imports ────────────────────────────────────────────
  imports: {
    get: (importSessionId: string) =>
      apiFetch<{ importSession: ImportSessionResponse }>(`/api/imports/${importSessionId}`),

    upload: (groupId: string, file: File, mapping?: Record<string, string>, strictMode?: boolean) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", groupId);
      if (mapping) {
        formData.append("mapping", JSON.stringify(mapping));
      }
      if (strictMode !== undefined) {
        formData.append("strictMode", String(strictMode));
      }
      return apiFetch<{ importSession: ImportSessionResponse }>(`/api/groups/${groupId}/imports`, {
        method: "POST",
        body: formData,
        headers: {}, // Let browser set multipart content-type
      });
    },
  },
  // ── Preferences ────────────────────────────────────────
  preferences: {
    get: () =>
      apiFetch<{ preferences: { theme: string; currency: string; notificationsEnabled: boolean } }>("/api/user/preferences"),
  },

  // ── Notifications ──────────────────────────────────────
  notifications: {
    list: () =>
      apiFetch<{ notifications: NotificationResponse[] }>("/api/notifications"),

    read: (id: string) =>
      apiFetch<{ notification: NotificationResponse }>(`/api/notifications/${id}/read`, {
        method: "PATCH",
      }),

    readAll: () =>
      apiFetch<{ success: boolean }>("/api/notifications/read-all", {
        method: "PATCH",
      }),
  },
} as const;

export { ApiError };
