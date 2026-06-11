import { loadEnv } from "./load-env";
loadEnv();

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import {
  getAdminClient,
  isTypesenseEnabled,
  postsSchema,
  POSTS_COLLECTION,
} from "@/lib/typesense";

async function main() {
  if (!isTypesenseEnabled) {
    console.log(
      "Typesense is not configured (set NEXT_PUBLIC_TYPESENSE_HOST and TYPESENSE_ADMIN_KEY). Skipping.",
    );
    process.exit(0);
  }

  await connectDB();
  const client = getAdminClient();

  // Recreate the collection.
  try {
    await client.collections(POSTS_COLLECTION).delete();
    console.log("Dropped existing collection.");
  } catch {
    /* collection didn't exist */
  }
  await client.collections().create(postsSchema as never);
  console.log("Created collection schema.");

  const posts = await Post.find({ isRemoved: false }).lean();
  const docs = posts.map((p) => ({
    id: String(p._id),
    title: p.title,
    company: p.company,
    companySlug: p.companySlug,
    role: p.role,
    roleSlug: p.roleSlug,
    location: p.location ?? "",
    experienceLevel: p.experienceLevel,
    interviewType: p.interviewType,
    outcome: p.outcome,
    difficulty: p.difficulty,
    tags: p.tags ?? [],
    questions: p.questions ?? [],
    content: (p.content ?? "").slice(0, 2000),
    slug: p.slug,
    score: p.score ?? 0,
    createdAt: new Date(p.createdAt).getTime(),
  }));

  if (docs.length) {
    await client
      .collections(POSTS_COLLECTION)
      .documents()
      .import(docs, { action: "upsert" });
  }
  console.log(`Indexed ${docs.length} posts into Typesense.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
