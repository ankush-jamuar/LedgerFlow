import { SplitType } from "@prisma/client";
import { z } from "zod";
import {
  currencyCodeSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
} from "@/validations";
import { clerkUserIdSchema } from "@/lib/memberships/validation";

export const splitTypeSchema = z.enum([
  SplitType.EQUAL,
  SplitType.EXACT,
  SplitType.PERCENTAGE,
  SplitType.SHARES,
]);

export const expenseParticipantInputSchema = z.object({
  userId: clerkUserIdSchema,
  splitValue: z.number().nonnegative().optional(),
});

export const createExpenseSchema = z.object({
  groupId: z.string().uuid(),
  paidById: clerkUserIdSchema,
  splitType: splitTypeSchema,
  description: nonEmptyStringSchema.max(240),
  date: z.coerce.date(),
  receiptUrl: z.string().url().nullable().optional(),
  originalAmount: moneyAmountSchema,
  originalCurrency: currencyCodeSchema,
  exchangeRate: z.number().positive().default(1),
  participants: z.array(expenseParticipantInputSchema).min(1),
});

export const updateExpenseSchema = z
  .object({
    paidById: clerkUserIdSchema.optional(),
    splitType: splitTypeSchema.optional(),
    description: nonEmptyStringSchema.max(240).optional(),
    date: z.coerce.date().optional(),
    receiptUrl: z.string().url().nullable().optional(),
    originalAmount: moneyAmountSchema.optional(),
    originalCurrency: currencyCodeSchema.optional(),
    exchangeRate: z.number().positive().optional(),
    participants: z.array(expenseParticipantInputSchema).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one expense field is required",
  });

export type ExpenseParticipantInput = z.infer<
  typeof expenseParticipantInputSchema
>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
