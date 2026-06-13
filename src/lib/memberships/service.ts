import { GroupRole, Prisma } from "@prisma/client";
import { ACTIVITY_ACTIONS, createActivityLog } from "@/lib/activity";
import { conflict, forbidden, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { assertGroupIsOpen } from "@/lib/groups/service";
import { requireGroupRole } from "@/lib/memberships/rules";
import type {
  AddMemberInput,
  ChangeRoleInput,
} from "@/lib/memberships/validation";

const membershipInclude = {
  user: true,
  invitedBy: true,
} satisfies Prisma.GroupMemberInclude;

export async function listMembers(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  return prisma.groupMember.findMany({
    where: { groupId, isActive: true },
    include: membershipInclude,
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });
}

export async function getMembershipTimeline(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.MEMBER);

  return prisma.groupMember.findMany({
    where: { groupId },
    include: membershipInclude,
    orderBy: [{ joinedAt: "asc" }, { updatedAt: "asc" }],
  });
}

export async function addMember(
  actorId: string,
  groupId: string,
  input: AddMemberInput
) {
  await assertGroupIsOpen(groupId);
  await requireGroupRole(groupId, actorId, GroupRole.ADMIN);

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    notFound("User not found");
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: input.userId } },
  });

  if (existing?.isActive) {
    conflict("User is already an active group member");
  }

  const member = existing
    ? await prisma.groupMember.update({
        where: { id: existing.id },
        data: {
          role: input.role,
          joinedAt: new Date(),
          leftAt: null,
          isActive: true,
          invitedById: actorId,
        },
        include: membershipInclude,
      })
    : await prisma.groupMember.create({
        data: {
          groupId,
          userId: input.userId,
          role: input.role,
          invitedById: actorId,
        },
        include: membershipInclude,
      });

  await createActivityLog({
    actorId,
    groupId,
    action: ACTIVITY_ACTIONS.MEMBER_ADDED,
    entityType: "GroupMember",
    entityId: member.id,
    metadata: { userId: input.userId, role: input.role },
  });

  return member;
}

export async function removeMember(
  actorId: string,
  groupId: string,
  userId: string
) {
  await assertGroupIsOpen(groupId);
  const actor = await requireGroupRole(groupId, actorId, GroupRole.ADMIN);

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member || !member.isActive) {
    notFound("Active group member not found");
  }

  if (member.role === GroupRole.OWNER && actor.role !== GroupRole.OWNER) {
    forbidden("Only an owner can remove an owner");
  }

  if (member.role === GroupRole.OWNER) {
    const activeOwnerCount = await prisma.groupMember.count({
      where: { groupId, role: GroupRole.OWNER, isActive: true },
    });
    if (activeOwnerCount <= 1) {
      conflict("Cannot remove the last active owner");
    }
  }

  const removed = await prisma.groupMember.update({
    where: { id: member.id },
    data: { leftAt: new Date(), isActive: false },
    include: membershipInclude,
  });

  await createActivityLog({
    actorId,
    groupId,
    action: ACTIVITY_ACTIONS.MEMBER_REMOVED,
    entityType: "GroupMember",
    entityId: member.id,
    metadata: { userId },
  });

  return removed;
}

export async function changeMemberRole(
  actorId: string,
  groupId: string,
  userId: string,
  input: ChangeRoleInput
) {
  await assertGroupIsOpen(groupId);
  const actor = await requireGroupRole(groupId, actorId, GroupRole.ADMIN);

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member || !member.isActive) {
    notFound("Active group member not found");
  }

  if (member.role === GroupRole.OWNER && actor.role !== GroupRole.OWNER) {
    forbidden("Only an owner can change an owner role");
  }

  if (member.role === GroupRole.OWNER && input.role !== GroupRole.OWNER) {
    const activeOwnerCount = await prisma.groupMember.count({
      where: { groupId, role: GroupRole.OWNER, isActive: true },
    });
    if (activeOwnerCount <= 1) {
      conflict("Cannot demote the last active owner");
    }
  }

  const updated = await prisma.groupMember.update({
    where: { id: member.id },
    data: { role: input.role },
    include: membershipInclude,
  });

  await createActivityLog({
    actorId,
    groupId,
    action: ACTIVITY_ACTIONS.ROLE_CHANGED,
    entityType: "GroupMember",
    entityId: member.id,
    metadata: { userId, from: member.role, to: input.role },
  });

  return updated;
}
