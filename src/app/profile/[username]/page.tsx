import {
  getProfileByUserName,
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./profilePageClient";

export const generateMetadata = async ({
  params,
}: {
  params: { username: string };
}) => {
  const user = await getProfileByUserName(params.username);
  if (!user) return;

  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Checkout ${user.username}'s profile.`,
  };
};

const page = async ({ params }: { params: { username: string } }) => {
  const user = await getProfileByUserName(params.username);
  if (!user) return notFound();

  const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    isFollowing(user.id),
  ]);

  return (
    <ProfilePageClient
      user={user}
      likedPosts={likedPosts}
      posts={posts}
      isFollowing={isCurrentUserFollowing}
    />
  );
};

export default page;
