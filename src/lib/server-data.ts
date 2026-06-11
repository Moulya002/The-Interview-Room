import { connectDB } from "@/lib/db";
import { Post, Vote, Bookmark } from "@/models";
import { getCurrentUser } from "@/lib/api-helpers";
import { serializePost } from "@/lib/serializers";
import type { PostDTO } from "@/types";

/** Read a post for server-side rendering (does not increment views). */
export async function getPostBySlug(slug: string): Promise<PostDTO | null> {
  await connectDB();
  const post = await Post.findOne({ slug, isRemoved: false })
    .populate("createdBy", "name avatar image reputation")
    .lean();
  if (!post) return null;

  const user = await getCurrentUser();
  let userVote = 0;
  let isBookmarked = false;
  if (user) {
    const [vote, bookmark] = await Promise.all([
      Vote.findOne({ userId: user.id, targetId: post._id, targetType: "post" }).lean(),
      Bookmark.findOne({ userId: user.id, postId: post._id }).lean(),
    ]);
    userVote = vote?.value ?? 0;
    isBookmarked = Boolean(bookmark);
  }
  return serializePost(post, { userVote, isBookmarked });
}
