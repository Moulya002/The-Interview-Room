import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { computeStats } from "@/lib/aggregations";
import { serializePost } from "@/lib/serializers";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { slug } = await params;
    const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "10"));

    const stats = await computeStats({ roleSlug: slug });
    const sample = await Post.findOne({ roleSlug: slug }).select("role").lean();
    const posts = await Post.find({ roleSlug: slug, isRemoved: false })
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .populate("createdBy", "name avatar image reputation")
      .lean();

    // Top companies hiring for this role.
    const topCompanies = await Post.aggregate([
      { $match: { roleSlug: slug, isRemoved: false } },
      { $group: { _id: { company: "$company", slug: "$companySlug" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, company: "$_id.company", slug: "$_id.slug", count: 1 } },
    ]);

    return ok({
      name: sample?.role ?? slug,
      slug,
      stats,
      topCompanies,
      posts: posts.map((p) => serializePost(p)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
