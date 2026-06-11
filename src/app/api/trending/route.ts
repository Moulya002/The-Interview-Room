import { ok, handleApiError } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const topCompanies = await Post.aggregate([
      { $match: { isRemoved: false } },
      {
        $group: {
          _id: { company: "$company", slug: "$companySlug" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, name: "$_id.company", slug: "$_id.slug", count: 1 } },
    ]);

    const topRoles = await Post.aggregate([
      { $match: { isRemoved: false } },
      {
        $group: {
          _id: { role: "$role", slug: "$roleSlug" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, name: "$_id.role", slug: "$_id.slug", count: 1 } },
    ]);

    const trendingTags = await Post.aggregate([
      { $match: { isRemoved: false } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);

    return ok({ topCompanies, topRoles, trendingTags });
  } catch (err) {
    return handleApiError(err);
  }
}
