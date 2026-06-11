import { NextRequest } from "next/server";
import {
  ok,
  handleApiError,
  requireUser,
  parseListParams,
} from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Bookmark, Post } from "@/models";
import { serializePost } from "@/lib/serializers";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const { page, limit, skip } = parseListParams(req.nextUrl.searchParams);

    const bookmarks = await Bookmark.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "postId",
        populate: { path: "createdBy", select: "name avatar image reputation" },
      })
      .lean();

    const items = bookmarks
      .filter((b) => b.postId)
      .map((b) => serializePost(b.postId, { isBookmarked: true }));

    const total = await Bookmark.countDocuments({ userId: user.id });
    return ok({ items, page, limit, total, hasMore: skip + items.length < total });
  } catch (err) {
    return handleApiError(err);
  }
}

const toggleSchema = z.object({ postId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const { postId } = toggleSchema.parse(await req.json());
    const post = await Post.findById(postId).select("_id").lean();
    if (!post) return ok({ bookmarked: false });

    const existing = await Bookmark.findOne({ userId: user.id, postId });
    if (existing) {
      await existing.deleteOne();
      return ok({ bookmarked: false });
    }
    await Bookmark.create({ userId: user.id, postId });
    return ok({ bookmarked: true });
  } catch (err) {
    return handleApiError(err);
  }
}
