import { Post } from "@/models";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Compute aggregate statistics for a set of posts matching a filter
 * (used by both company and role pages).
 */
export async function computeStats(match: Record<string, unknown>) {
  const base = { ...match, isRemoved: false };

  const [overview] = await Post.aggregate([
    { $match: base },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgDifficulty: { $avg: "$difficulty" },
        avgRounds: { $avg: "$rounds" },
        selected: {
          $sum: { $cond: [{ $eq: ["$outcome", "Selected"] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$outcome", "Rejected"] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$outcome", "Pending"] }, 1, 0] },
        },
      },
    },
  ]);

  const topQuestions = await Post.aggregate([
    { $match: base },
    { $unwind: "$questions" },
    { $group: { _id: "$questions", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, question: "$_id", count: 1 } },
  ]);

  const topTags = await Post.aggregate([
    { $match: base },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);

  const difficultyDistribution = await Post.aggregate([
    { $match: base },
    { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, difficulty: "$_id", count: 1 } },
  ]);

  return {
    total: overview?.total ?? 0,
    avgDifficulty: Number((overview?.avgDifficulty ?? 0).toFixed(1)),
    avgRounds: Number((overview?.avgRounds ?? 0).toFixed(1)),
    outcomes: {
      Selected: overview?.selected ?? 0,
      Rejected: overview?.rejected ?? 0,
      Pending: overview?.pending ?? 0,
    },
    topQuestions,
    topTags,
    difficultyDistribution,
  };
}
