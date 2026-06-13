/**
 * src/types/index.ts — Shared TypeScript Types
 *
 * Application-wide type definitions that are not tied to a specific
 * feature module. Business entity types (User, Group, Expense, etc.)
 * will be generated from the Prisma schema in Phase 2 and re-exported here.
 */

/** Generic API response envelope for server actions */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Pagination metadata returned alongside list queries */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Paginated response shape */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Sort direction for list queries */
export type SortDirection = "asc" | "desc";

/** Generic sort parameter */
export interface SortParam<TField extends string = string> {
  field: TField;
  direction: SortDirection;
}

/** ISO 4217 currency code string */
export type CurrencyCode = string;

/** Application-level error codes */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Structured application error */
export interface AppError {
  code: ErrorCode;
  message: string;
  field?: string;
}
