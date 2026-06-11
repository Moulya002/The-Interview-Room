import {
  getAdminClient,
  isTypesenseEnabled,
  POSTS_COLLECTION,
  type PostDocument,
} from "@/lib/typesense";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toDocument(post: any): PostDocument {
  return {
    id: String(post._id),
    title: post.title,
    company: post.company,
    companySlug: post.companySlug,
    role: post.role,
    roleSlug: post.roleSlug,
    location: post.location ?? "",
    experienceLevel: post.experienceLevel,
    interviewType: post.interviewType,
    outcome: post.outcome,
    difficulty: post.difficulty,
    tags: post.tags ?? [],
    questions: post.questions ?? [],
    content: (post.content ?? "").slice(0, 2000),
    slug: post.slug,
    score: post.score ?? 0,
    createdAt: new Date(post.createdAt).getTime(),
  };
}

/** Upsert a single post into the Typesense index. Safe no-op if disabled. */
export async function indexPost(post: any) {
  if (!isTypesenseEnabled) return;
  try {
    const client = getAdminClient();
    await client
      .collections(POSTS_COLLECTION)
      .documents()
      .upsert(toDocument(post));
  } catch (err) {
    console.error("[TYPESENSE_INDEX_ERROR]", err);
  }
}

export async function removeFromIndex(postId: string) {
  if (!isTypesenseEnabled) return;
  try {
    const client = getAdminClient();
    await client
      .collections(POSTS_COLLECTION)
      .documents(String(postId))
      .delete();
  } catch (err) {
    console.error("[TYPESENSE_DELETE_ERROR]", err);
  }
}
