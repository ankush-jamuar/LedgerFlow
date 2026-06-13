import { z } from "zod";
import { currencyCodeSchema, nonEmptyStringSchema } from "@/validations";

export const groupIdSchema = z.string().uuid();

export const createGroupSchema = z.object({
  name: nonEmptyStringSchema.max(120),
  description: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  currency: currencyCodeSchema.default("INR"),
});

export const updateGroupSchema = z
  .object({
    name: nonEmptyStringSchema.max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    currency: currencyCodeSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one group field is required",
  });

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
