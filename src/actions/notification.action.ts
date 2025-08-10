"use server";

import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";

export const getNotifications = async () => {
  const userId = await getDbUserId();

  if (!userId) return [];

  try {
    const data = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        creator: {
          select: {
            username: true,
            image: true,
            id: true,
            name: true,
          },
        },
        post: {
          select: {
            content: true,
            id: true,
            image: true,
          },
        },
        comment: {
          select: {
            content: true,
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return data;
  } catch (error) {
    console.log(error);
    throw new Error("Error in getting notitfications.");
  }
};
export const markAsRead = async (notifications: string[]) => {
  try {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notifications,
        },
      },
      data: {
        read: true,
      },
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
