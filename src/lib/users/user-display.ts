import type { User } from "@prisma/client";

export function getUserDisplayName(user: Pick<User, "username" | "email" | "phone">): string {
  return user.username ?? user.email ?? user.phone ?? "Group Member";
}

export function getUserContactLabel(user: Pick<User, "email" | "phone">): string {
  return user.email ?? user.phone ?? "No contact method synced";
}
