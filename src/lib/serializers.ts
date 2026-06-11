import type { PostDTO, CommentDTO, AuthorDTO } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function serializeAuthor(user: any): AuthorDTO | null {
  if (!user || typeof user !== "object" || !user._id) return null;
  return {
    _id: String(user._id),
    name: user.name ?? "Unknown",
    avatar: user.avatar ?? "",
    image: user.image ?? "",
    reputation: user.reputation ?? 0,
  };
}

export function serializePost(
  doc: any,
  opts: { userVote?: number; isBookmarked?: boolean } = {},
): PostDTO {
  const anonymous = Boolean(doc.isAnonymous);
  return {
    _id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    company: doc.company,
    companySlug: doc.companySlug,
    role: doc.role,
    roleSlug: doc.roleSlug,
    location: doc.location ?? "",
    experienceLevel: doc.experienceLevel,
    interviewType: doc.interviewType,
    interviewDate: doc.interviewDate ? new Date(doc.interviewDate).toISOString() : null,
    rounds: doc.rounds ?? 1,
    roundBreakdown: doc.roundBreakdown ?? [],
    outcome: doc.outcome,
    difficulty: doc.difficulty,
    salaryMin: doc.salaryMin ?? null,
    salaryMax: doc.salaryMax ?? null,
    salaryCurrency: doc.salaryCurrency ?? "USD",
    preparationResources: doc.preparationResources ?? [],
    questions: doc.questions ?? [],
    tips: doc.tips ?? "",
    content: doc.content ?? "",
    tags: doc.tags ?? [],
    isAnonymous: anonymous,
    author: anonymous ? null : serializeAuthor(doc.createdBy),
    upvotes: doc.upvotes ?? 0,
    downvotes: doc.downvotes ?? 0,
    score: doc.score ?? 0,
    commentCount: doc.commentCount ?? 0,
    views: doc.views ?? 0,
    createdAt: new Date(doc.createdAt).toISOString(),
    userVote: opts.userVote ?? 0,
    isBookmarked: opts.isBookmarked ?? false,
    source: doc.source ?? "",
    sourceUrl: doc.sourceUrl ?? "",
    sourceAuthor: doc.sourceAuthor ?? "",
  };
}

export function serializeComment(
  doc: any,
  opts: { userVote?: number } = {},
): CommentDTO {
  const anonymous = Boolean(doc.isAnonymous);
  return {
    _id: String(doc._id),
    postId: String(doc.postId),
    parentCommentId: doc.parentCommentId ? String(doc.parentCommentId) : null,
    content: doc.isRemoved ? "[removed]" : doc.content,
    author: anonymous ? null : serializeAuthor(doc.userId),
    isAnonymous: anonymous,
    upvotes: doc.upvotes ?? 0,
    downvotes: doc.downvotes ?? 0,
    score: doc.score ?? 0,
    isEdited: Boolean(doc.isEdited),
    isRemoved: Boolean(doc.isRemoved),
    createdAt: new Date(doc.createdAt).toISOString(),
    userVote: opts.userVote ?? 0,
    replies: [],
  };
}

/** Build a nested comment tree from a flat list. */
export function buildCommentTree(comments: CommentDTO[]): CommentDTO[] {
  const map = new Map<string, CommentDTO>();
  const roots: CommentDTO[] = [];
  comments.forEach((c) => map.set(c._id, { ...c, replies: [] }));
  comments.forEach((c) => {
    const node = map.get(c._id)!;
    if (c.parentCommentId && map.has(c.parentCommentId)) {
      map.get(c.parentCommentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
