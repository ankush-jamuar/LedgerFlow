import { z } from "zod";
import { currencyCodeSchema, moneyAmountSchema } from "@/validations";
import { clerkUserIdSchema } from "@/lib/memberships/validation";

export const createSettlementSchema = z
  .object({
    groupId: z.string().uuid(),
    payerId: clerkUserIdSchema,
    receiverId: clerkUserIdSchema,
    note: z.string().trim().max(500).nullable().optional(),
    settledAt: z.coerce.date().default(() => new Date()),
    originalAmount: moneyAmountSchema,
    originalCurrency: currencyCodeSchema,
    exchangeRate: z.number().positive().default(1),
  })
  .refine((value) => value.payerId !== value.receiverId, {
    message: "Payer and receiver must be different users",
    path: ["receiverId"],
  });

export const updateSettlementSchema = z
  .object({
    note: z.string().trim().max(500).nullable().optional(),
    settledAt: z.coerce.date().optional(),
    originalAmount: moneyAmountSchema.optional(),
    originalCurrency: currencyCodeSchema.optional(),
    exchangeRate: z.number().positive().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one settlement field is required",
  });

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;
