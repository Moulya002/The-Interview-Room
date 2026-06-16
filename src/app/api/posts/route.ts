import { NextRequest } from "next/server";
import {
  ok,
  handleApiError,
  requireUser,
  getCurrentUser,
  parseListParams,
} from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post, Vote, Bookmark, Activity } from "@/models";
import { createPostSchema } from "@/lib/validations";
import { postSlug, slugify } from "@/lib/utils";
import { serializePost } from "@/lib/serializers";
import { indexPost } from "@/lib/search-index";
import type { Paginated, PostDTO } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parseListParams(sp);
    const sort = sp.get("sort") ?? "trending";

    const filter: Record<string, unknown> = { isRemoved: false };
    if (sp.get("company")) filter.companySlug = slugify(sp.get("company")!);
    if (sp.get("role")) filter.roleSlug = slugify(sp.get("role")!);
    if (sp.get("location"))
      filter.location = { $regex: sp.get("location"), $options: "i" };
    if (sp.get("outcome")) filter.outcome = sp.get("outcome");
    if (sp.get("interviewType")) filter.interviewType = sp.get("interviewType");
    if (sp.get("experienceLevel"))
      filter.experienceLevel = sp.get("experienceLevel");
    if (sp.get("tag")) filter.tags = sp.get("tag");
    const difficulty = sp.get("difficulty");
    if (difficulty) {
      const [min, max] = difficulty.split("-").map(Number);
      filter.difficulty = max ? { $gte: min, $lte: max } : { $gte: min };
    }

    let sortStage: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "top") sortStage = { score: -1, createdAt: -1 };
    if (sort === "trending") sortStage = { score: -1, commentCount: -1, createdAt: -1 };

    const [docs, total] = await Promise.all([
      Post.find(filter)
        .sort(sortStage)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name avatar image reputation")
        .lean(),
      Post.countDocuments(filter),
    ]);

    const user = await getCurrentUser();
    let voteMap = new Map<string, number>();
    let bookmarkSet = new Set<string>();
    if (user) {
      const ids = docs.map((d) => d._id);
      const [votes, bookmarks] = await Promise.all([
        Vote.find({ userId: user.id, targetType: "post", targetId: { $in: ids } }).lean(),
        Bookmark.find({ userId: user.id, postId: { $in: ids } }).lean(),
      ]);
      voteMap = new Map(votes.map((v) => [String(v.targetId), v.value]));
      bookmarkSet = new Set(bookmarks.map((b) => String(b.postId)));
    }

    const items = docs.map((d) =>
      serializePost(d, {
        userVote: voteMap.get(String(d._id)) ?? 0,
        isBookmarked: bookmarkSet.has(String(d._id)),
      }),
    );

    const result: Paginated<PostDTO> = {
      items,
      page,
      limit,
      total,
      hasMore: skip + docs.length < total,
    };
    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const body = await req.json();
    const data = createPostSchema.parse(body);

    const slug = postSlug(data.company, data.role);
    const title = data.title;

    const post = await Post.create({
      ...data,
      title,
      slug,
      companySlug: slugify(data.company),
      roleSlug: slugify(data.role),
      interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
      createdBy: user.id,
      score: 0,
    });

    await indexPost(post.toObject());

    await Activity.create({
      userId: user.id,
      userName: user.name ?? "",
      userEmail: user.email ?? "",
      type: "post",
      postId: post._id,
      postSlug: slug,
    });

    const populated = await post.populate("createdBy", "name avatar image reputation");
    return ok(serializePost(populated.toObject()), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
