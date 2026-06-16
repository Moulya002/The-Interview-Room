import { ok, handleApiError, requireAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User, Post, Comment, Report, Activity } from "@/models";

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

    // Engagement: how many distinct users are actually participating, plus the
    // raw number of actions, derived from the Activity log.
    const [distinctPosters, distinctCommenters, postActions, commentActions] =
      await Promise.all([
        Activity.distinct("userId", { type: "post" }),
        Activity.distinct("userId", { type: "comment" }),
        Activity.countDocuments({ type: "post" }),
        Activity.countDocuments({ type: "comment" }),
      ]);

    const recentActivity = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    return ok({
      totals: { users, posts, comments, openReports },
      engagement: {
        posters: distinctPosters.length,
        commenters: distinctCommenters.length,
        postActions,
        commentActions,
      },
      recentActivity: recentActivity.map((a) => ({
        id: String(a._id),
        type: a.type,
        userName: a.userName || "Unknown",
        userEmail: a.userEmail || "",
        postSlug: a.postSlug || "",
        createdAt: new Date(a.createdAt as Date).toISOString(),
      })),
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
