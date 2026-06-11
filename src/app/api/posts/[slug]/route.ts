import { NextRequest } from "next/server";
import {
  ok,
  fail,
  handleApiError,
  requireUser,
  getCurrentUser,
  ApiError,
} from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post, Vote, Bookmark } from "@/models";
import { updatePostSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { serializePost } from "@/lib/serializers";
import { indexPost, removeFromIndex } from "@/lib/search-index";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { slug } = await params;
    const post = await Post.findOneAndUpdate(
      { slug, isRemoved: false },
      { $inc: { views: 1 } },
      { new: true },
    )
      .populate("createdBy", "name avatar image reputation")
      .lean();

    if (!post) return fail("Post not found", 404);

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

    return ok(serializePost(post, { userVote, isBookmarked }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    await connectDB();
    const { slug } = await params;
    const post = await Post.findOne({ slug });
    if (!post) return fail("Post not found", 404);
    if (String(post.createdBy) !== user.id && user.role !== "admin") {
      throw new ApiError("You can only edit your own posts", 403);
    }

    const data = updatePostSchema.parse(await req.json());
    Object.assign(post, data);
    if (data.company) post.companySlug = slugify(data.company);
    if (data.role) post.roleSlug = slugify(data.role);
    await post.save();
    await indexPost(post.toObject());

    const populated = await post.populate("createdBy", "name avatar image reputation");
    return ok(serializePost(populated.toObject()));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    await connectDB();
    const { slug } = await params;
    const post = await Post.findOne({ slug });
    if (!post) return fail("Post not found", 404);
    if (String(post.createdBy) !== user.id && user.role !== "admin") {
      throw new ApiError("You can only delete your own posts", 403);
    }
    post.isRemoved = true;
    await post.save();
    await removeFromIndex(String(post._id));
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
