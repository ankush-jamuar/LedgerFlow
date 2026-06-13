import { GroupRole, Prisma } from "@prisma/client";
import { ACTIVITY_ACTIONS, createActivityLog } from "@/lib/activity";
import { forbidden, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { requireActiveMembership, requireGroupRole } from "@/lib/memberships/rules";
import type { CreateGroupInput, UpdateGroupInput } from "@/lib/groups/validation";

const groupInclude = {
  memberships: {
    where: { isActive: true },
    include: { user: true },
    orderBy: { joinedAt: "asc" as const },
  },
} satisfies Prisma.GroupInclude;

export async function createGroup(actorId: string, input: CreateGroupInput) {
  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        currency: input.currency,
        createdById: actorId,
        memberships: {
          create: {
            userId: actorId,
            role: GroupRole.OWNER,
            isActive: true,
          },
        },
      },
      include: groupInclude,
    });

    await tx.activityLog.create({
      data: {
        actorId,
        groupId: created.id,
        action: ACTIVITY_ACTIONS.GROUP_CREATED,
        entityType: "Group",
        entityId: created.id,
        metadata: { name: created.name },
      },
    });

    return created;
  });

  return group;
}

export async function listGroups(actorId: string) {
  return prisma.group.findMany({
    where: {
      memberships: {
        some: {
          userId: actorId,
          isActive: true,
        },
      },
    },
    include: groupInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getGroup(actorId: string, groupId: string) {
  await requireActiveMembership(groupId, actorId);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  if (!group) {
    notFound("Group not found");
  }

  return group;
}

export async function updateGroup(
  actorId: string,
  groupId: string,
  input: UpdateGroupInput
) {
  await requireGroupRole(groupId, actorId, GroupRole.ADMIN);

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      currency: input.currency,
    },
    include: groupInclude,
  });

  await createActivityLog({
    actorId,
    groupId,
    action: ACTIVITY_ACTIONS.GROUP_UPDATED,
    entityType: "Group",
    entityId: groupId,
    metadata: input as Prisma.InputJsonObject,
  });

  return group;
}

export async function archiveGroup(actorId: string, groupId: string) {
  await requireGroupRole(groupId, actorId, GroupRole.OWNER);

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { isArchived: true },
    include: groupInclude,
  });

  await createActivityLog({
    actorId,
    groupId,
    action: ACTIVITY_ACTIONS.GROUP_ARCHIVED,
    entityType: "Group",
    entityId: groupId,
  });

  return group;
}

export async function assertGroupIsOpen(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group) {
    notFound("Group not found");
  }

  if (group.isArchived) {
    forbidden("Archived groups cannot be modified");
  }

  return group;
}
