import { GroupRole } from "@prisma/client";
import { z } from "zod";

export const clerkUserIdSchema = z.string().trim().min(1);

export const groupRoleSchema = z.enum([
  GroupRole.OWNER,
  GroupRole.ADMIN,
  GroupRole.MEMBER,
]);

export const addMemberSchema = z.object({
  userId: clerkUserIdSchema,
  role: groupRoleSchema.default(GroupRole.MEMBER),
});

export const changeRoleSchema = z.object({
  role: groupRoleSchema,
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
