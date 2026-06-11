import { NextRequest } from "next/server";
import {
  ok,
  fail,
  handleApiError,
  requireUser,
  ApiError,
} from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Comment, Post } from "@/models";
import { serializeComment } from "@/lib/serializers";
import { z } from "zod";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const editSchema = z.object({ content: z.string().min(1).max(5000) });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    await connectDB();
    const { id } = await params;
    const comment = await Comment.findById(id);
    if (!comment) return fail("Comment not found", 404);
    if (String(comment.userId) !== user.id) {
      throw new ApiError("You can only edit your own comments", 403);
    }
    const { content } = editSchema.parse(await req.json());
    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    const populated = await comment.populate("userId", "name avatar image reputation");
    return ok(serializeComment(populated.toObject()));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    await connectDB();
    const { id } = await params;
    const comment = await Comment.findById(id);
    if (!comment) return fail("Comment not found", 404);
    if (String(comment.userId) !== user.id && user.role !== "admin") {
      throw new ApiError("You can only delete your own comments", 403);
    }
    comment.isRemoved = true;
    await comment.save();
    await Post.updateOne(
      { _id: comment.postId } as Record<string, unknown>,
      { $inc: { commentCount: -1 } },
    );
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
