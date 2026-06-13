import { GroupRole } from "@prisma/client";
import { forbidden, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";

const ROLE_RANK: Record<GroupRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasGroupRole(
  actorRole: GroupRole,
  minimumRole: GroupRole
): boolean {
  return ROLE_RANK[actorRole] >= ROLE_RANK[minimumRole];
}

export async function requireActiveMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || !membership.isActive) {
    notFound("Active group membership not found");
  }

  return membership;
}

export async function requireGroupRole(
  groupId: string,
  userId: string,
  minimumRole: GroupRole
) {
  const membership = await requireActiveMembership(groupId, userId);

  if (!hasGroupRole(membership.role, minimumRole)) {
    forbidden(`Requires ${minimumRole} access`);
  }

  return membership;
}

export function isMemberActiveOnDate(
  membership: { joinedAt: Date; leftAt: Date | null },
  expenseDate: Date
): boolean {
  return (
    expenseDate >= membership.joinedAt &&
    (membership.leftAt === null || expenseDate <= membership.leftAt)
  );
}
