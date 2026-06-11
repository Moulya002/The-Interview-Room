import { NextRequest } from "next/server";
import {
  ok,
  fail,
  handleApiError,
  requireUser,
  getCurrentUser,
} from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post, Comment, Vote, Notification, User } from "@/models";
import { commentSchema } from "@/lib/validations";
import { serializeComment, buildCommentTree } from "@/lib/serializers";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { slug } = await params;
    const post = await Post.findOne({ slug }).select("_id").lean();
    if (!post) return fail("Post not found", 404);

    const comments = await Comment.find({ postId: post._id })
      .sort({ score: -1, createdAt: 1 })
      .populate("userId", "name avatar image reputation")
      .lean();

    const user = await getCurrentUser();
    let voteMap = new Map<string, number>();
    if (user) {
      const votes = await Vote.find({
        userId: user.id,
        targetType: "comment",
        targetId: { $in: comments.map((c) => c._id) },
      }).lean();
      voteMap = new Map(votes.map((v) => [String(v.targetId), v.value]));
    }

    const flat = comments.map((c) =>
      serializeComment(c, { userVote: voteMap.get(String(c._id)) ?? 0 }),
    );
    return ok(buildCommentTree(flat));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    await connectDB();
    const { slug } = await params;
    const post = await Post.findOne({ slug });
    if (!post) return fail("Post not found", 404);

    const data = commentSchema.parse(await req.json());
    const comment = await Comment.create({
      postId: post._id,
      parentCommentId: data.parentCommentId || null,
      content: data.content,
      userId: user.id,
      isAnonymous: data.isAnonymous,
    });

    await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

    // Notify the post author (skip self-comments).
    if (post.createdBy && String(post.createdBy) !== user.id) {
      await Notification.create({
        userId: post.createdBy,
        actorId: user.id,
        type: data.parentCommentId ? "reply" : "comment",
        message: `${user.name ?? "Someone"} commented on your interview experience`,
        link: `/post/${slug}`,
      });
    }
    // Reward the commenter with karma.
    await User.updateOne({ _id: user.id }, { $inc: { commentKarma: 1, reputation: 1 } });

    const populated = await comment.populate("userId", "name avatar image reputation");
    return ok(serializeComment(populated.toObject()), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
