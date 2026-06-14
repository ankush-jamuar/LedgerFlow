import { GroupRole, Prisma } from "@prisma/client";
import { ACTIVITY_ACTIONS, createActivityLog } from "@/lib/activity";
import { conflict, forbidden, notFound } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { assertGroupIsOpen } from "@/lib/groups/service";
import { requireGroupRole } from "@/lib/memberships/rules";
import { createDbNotification } from "@/lib/notifications/service";
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

  const memberships = await prisma.groupMember.findMany({
    where: { groupId },
    include: membershipInclude,
  });

  const logs = await prisma.activityLog.findMany({
    where: {
      groupId,
      action: {
        in: [
          ACTIVITY_ACTIONS.MEMBER_ADDED,
          ACTIVITY_ACTIONS.MEMBER_REMOVED,
          ACTIVITY_ACTIONS.ROLE_CHANGED,
        ],
      },
    },
    include: {
      actor: true,
    },
    orderBy: { createdAt: "asc" },
  });

  type TimelineEvent = {
    id: string;
    type: string;
    userId: string;
    userName: string;
    role: string;
    date: string;
    fromRole?: string;
    user?: {
      id: string;
      username: string | null;
      email: string | null;
      imageUrl: string | null;
    };
  };

  const events: TimelineEvent[] = [];

  for (const m of memberships) {
    const userName = m.user.username || m.user.email?.split("@")[0] || m.userId;
    events.push({
      id: `${m.id}-join`,
      type: "joined",
      userId: m.userId,
      userName,
      role: m.role,
      date: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        username: m.user.username,
        email: m.user.email,
        imageUrl: m.user.imageUrl,
      },
    });

    if (m.leftAt) {
      events.push({
        id: `${m.id}-left`,
        type: "left",
        userId: m.userId,
        userName,
        role: m.role,
        date: m.leftAt.toISOString(),
        user: {
          id: m.user.id,
          username: m.user.username,
          email: m.user.email,
          imageUrl: m.user.imageUrl,
        },
      });
    }
  }

  for (const log of logs) {
    if (log.action === ACTIVITY_ACTIONS.ROLE_CHANGED) {
      const metadata = log.metadata as { userId?: string; from?: string; to?: string } | null;
      if (metadata && metadata.userId) {
        const targetUser = memberships.find((m) => m.userId === metadata.userId)?.user;
        const userName = targetUser?.username || targetUser?.email?.split("@")[0] || metadata.userId;
        events.push({
          id: `${log.id}-role`,
          type: "role_changed",
          userId: metadata.userId,
          userName,
          role: metadata.to || "MEMBER",
          fromRole: metadata.from || "MEMBER",
          date: log.createdAt.toISOString(),
          user: targetUser ? {
            id: targetUser.id,
            username: targetUser.username,
            email: targetUser.email,
            imageUrl: targetUser.imageUrl,
          } : undefined,
        });
      }
    }
  }

  // Sort chronologically descending (newest first)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
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

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  const groupName = group?.name || "Group";
  await createDbNotification({
    userId: input.userId,
    type: "GROUP_MEMBER_ADDED",
    title: "Added to Group",
    message: `You have been added to the group "${groupName}" as ${input.role}.`,
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

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  const groupName = group?.name || "Group";
  await createDbNotification({
    userId,
    type: "GROUP_MEMBER_REMOVED",
    title: "Removed from Group",
    message: `You have been removed from the group "${groupName}".`,
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
