/**
 * src/validations/index.ts — Shared Zod Validation Schemas
 *
 * Common validation schemas reused across server actions, API routes,
 * and form validation. Feature-specific schemas live in their own modules
 * and import from here as needed.
 */

import { z } from "zod";

/** UUID v4 string */
export const uuidSchema = z
  .string()
  .uuid("Must be a valid UUID");

/** Positive monetary amount with up to 2 decimal places */
export const moneyAmountSchema = z
  .number()
  .positive("Amount must be greater than zero")
  .multipleOf(0.01, "Amount cannot have more than 2 decimal places");

/** ISO 4217 currency code */
export const currencyCodeSchema = z
  .string()
  .length(3, "Currency code must be exactly 3 characters")
  .toUpperCase();

/** Standard pagination query parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** ISO 8601 date string */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

/** Non-empty trimmed string */
export const nonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, "This field is required");

/** Email address */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Must be a valid email address");

export type PaginationInput = z.infer<typeof paginationSchema>;
