import { prisma } from "@/lib/db/prisma";

export async function createDbNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
      },
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}
