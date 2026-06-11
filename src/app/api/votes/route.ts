import { NextRequest } from "next/server";
import { ok, handleApiError, requireUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Vote, Post, Comment, User } from "@/models";
import { voteSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const { targetId, targetType, value } = voteSchema.parse(await req.json());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Model: any = targetType === "post" ? Post : Comment;
    const target = await Model.findById(targetId);
    if (!target) return ok({ score: 0, userVote: 0 });

    const existing = await Vote.findOne({ userId: user.id, targetId });
    const prev = existing?.value ?? 0;
    // Toggling the same direction clears the vote.
    const next = prev === value ? 0 : value;

    if (next === 0) {
      if (existing) await existing.deleteOne();
    } else if (existing) {
      existing.value = next;
      await existing.save();
    } else {
      await Vote.create({ userId: user.id, targetId, targetType, value: next });
    }

    // Recompute the deltas applied to the target's tallies.
    const upDelta = (next === 1 ? 1 : 0) - (prev === 1 ? 1 : 0);
    const downDelta = (next === -1 ? 1 : 0) - (prev === -1 ? 1 : 0);
    const scoreDelta = next - prev;

    target.upvotes = Math.max(0, (target.upvotes ?? 0) + upDelta);
    target.downvotes = Math.max(0, (target.downvotes ?? 0) + downDelta);
    target.score = (target.score ?? 0) + scoreDelta;
    await target.save();

    // Adjust the author's reputation.
    const authorId = targetType === "post" ? target.createdBy : target.userId;
    if (authorId && String(authorId) !== user.id && scoreDelta !== 0) {
      const karmaField = targetType === "post" ? "postKarma" : "commentKarma";
      await User.updateOne(
        { _id: authorId },
        { $inc: { reputation: scoreDelta, [karmaField]: scoreDelta } },
      );
    }

    return ok({ score: target.score, userVote: next });
  } catch (err) {
    return handleApiError(err);
  }
}
