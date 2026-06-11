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

    const stats = await computeStats({ companySlug: slug });
    const sample = await Post.findOne({ companySlug: slug }).select("company").lean();
    const posts = await Post.find({ companySlug: slug, isRemoved: false })
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .populate("createdBy", "name avatar image reputation")
      .lean();

    return ok({
      name: sample?.company ?? slug,
      slug,
      stats,
      posts: posts.map((p) => serializePost(p)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
