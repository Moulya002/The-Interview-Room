import { NextRequest } from "next/server";
import { ok, fail, handleApiError, getCurrentUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User, Post } from "@/models";
import { serializePost } from "@/lib/serializers";
import type { UserProfileDTO } from "@/types";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid user id", 400);

    const doc = await User.findById(id).lean();
    if (!doc) return fail("User not found", 404);

    const viewer = await getCurrentUser();
    const posts = await Post.find({ createdBy: id, isRemoved: false, isAnonymous: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("createdBy", "name avatar image reputation")
      .lean();

    const profile: UserProfileDTO = {
      _id: String(doc._id),
      name: doc.name,
      avatar: doc.avatar,
      image: doc.image,
      bio: doc.bio,
      reputation: doc.reputation ?? 0,
      postKarma: doc.postKarma ?? 0,
      commentKarma: doc.commentKarma ?? 0,
      followerCount: doc.followers?.length ?? 0,
      followingCount: doc.following?.length ?? 0,
      isFollowing: viewer
        ? (doc.followers ?? []).some((f: any) => String(f) === viewer.id)
        : false,
      createdAt: new Date(doc.createdAt as any).toISOString(),
    };

    return ok({ profile, posts: posts.map((p) => serializePost(p)) });
  } catch (err) {
    return handleApiError(err);
  }
}
