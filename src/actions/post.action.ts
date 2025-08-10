"use server";
import { prisma } from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export const createPost = async (content: string, image: string) => {
  const userId = await getDbUserId();

  if (!userId) {
    return;
  }
  try {
    const post = await prisma.post.create({
      data: {
        content: content,
        image: image,
        authorId: userId,
      },
    });
    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.log(error);
  }
};

export const getPosts = async () => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to get posts.");
  }
};

export const toggleLike = async (postId: string) => {
  const userId = await getDbUserId();
  if (!userId) {
    return;
  }
  try {
    const isExists = await prisma.like.findUnique({
      where: {
        userId_postId: {
          postId: postId,
          userId: userId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return;
    }

    if (isExists) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId: userId,
            postId: postId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId,
                  creatorId: userId,
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
export const createComment = async (postId: string, content: string) => {
  const userId = await getDbUserId();

  if (!userId) return;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return;
    }

    const trans = await prisma.$transaction(async (tx) => {
      const newCom = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      if (post.authorId !== userId) {
        tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            commentId: newCom.id,
          },
        });
      }
      return [newCom];
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
export const deletePost = async (postId: string) => {
  const userId = await getDbUserId();
  if (!userId) throw new Error("Login First");

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) throw new Error("Post not found.");

    if (post.authorId !== userId) throw new Error("Unauthorized !");

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
