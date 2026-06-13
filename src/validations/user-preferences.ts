import { z } from "zod";
import { currencyCodeSchema } from "@/validations";

export const userPreferenceThemeSchema = z.enum(["dark", "light", "system"]);

export const userPreferenceUpdateSchema = z
  .object({
    theme: userPreferenceThemeSchema.optional(),
    currency: currencyCodeSchema.optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference field is required",
  });

export type UserPreferenceUpdateInput = z.infer<
  typeof userPreferenceUpdateSchema
>;
