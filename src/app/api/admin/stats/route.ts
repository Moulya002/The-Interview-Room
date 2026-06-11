import { ok, handleApiError, requireAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User, Post, Comment, Report } from "@/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const [users, posts, comments, openReports] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ isRemoved: false }),
      Comment.countDocuments({ isRemoved: false }),
      Report.countDocuments({ status: "pending" }),
    ]);

    const topCompanies = await Post.aggregate([
      { $match: { isRemoved: false } },
      {
        $group: {
          _id: { company: "$company", slug: "$companySlug" },
          posts: { $sum: 1 },
          views: { $sum: "$views" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          company: "$_id.company",
          slug: "$_id.slug",
          posts: 1,
          views: 1,
        },
      },
    ]);

    const topRoles = await Post.aggregate([
      { $match: { isRemoved: false } },
      {
        $group: {
          _id: { role: "$role", slug: "$roleSlug" },
          posts: { $sum: 1 },
          comments: { $sum: "$commentCount" },
        },
      },
      { $sort: { comments: -1, posts: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          role: "$_id.role",
          slug: "$_id.slug",
          posts: 1,
          comments: 1,
        },
      },
    ]);

    const trendingTags = await Post.aggregate([
      { $match: { isRemoved: false } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);

    const growthPipeline = (model: typeof Post | typeof User) =>
      model.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", count: 1 } },
      ]);

    const [postGrowth, userGrowth] = await Promise.all([
      growthPipeline(Post),
      growthPipeline(User),
    ]);

    return ok({
      totals: { users, posts, comments, openReports },
      topCompanies,
      topRoles,
      trendingTags,
      postGrowth,
      userGrowth,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
