import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { serializePost } from "@/lib/serializers";
import {
  getSearchClient,
  isTypesenseEnabled,
  POSTS_COLLECTION,
} from "@/lib/typesense";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim();
    const mode = sp.get("mode") ?? "full"; // "full" | "autocomplete"
    const limit = Math.min(20, Number(sp.get("limit") ?? "8"));

    if (!q) return ok({ items: [], suggestions: [], engine: "none" });

    // Prefer Typesense when configured.
    if (isTypesenseEnabled) {
      try {
        const client = getSearchClient();
        const res = await client
          .collections(POSTS_COLLECTION)
          .documents()
          .search({
            q,
            query_by: "title,company,role,tags,questions,content",
            per_page: limit,
            sort_by: mode === "full" ? "_text_match:desc,score:desc" : undefined,
          });
        const items = (res.hits ?? []).map((h) => h.document);
        const suggestions = items.slice(0, limit).map((d: any) => ({
          slug: d.slug,
          title: d.title,
          company: d.company,
          role: d.role,
        }));
        return ok({ items, suggestions, engine: "typesense", total: res.found });
      } catch (err) {
        console.error("[TYPESENSE_SEARCH_FALLBACK]", err);
      }
    }

    // Fallback: MongoDB search.
    await connectDB();
    const regex = { $regex: q, $options: "i" };
    const docs = await Post.find({
      isRemoved: false,
      $or: [
        { title: regex },
        { company: regex },
        { role: regex },
        { tags: regex },
        { questions: regex },
      ],
    })
      .sort({ score: -1 })
      .limit(limit)
      .populate("createdBy", "name avatar image reputation")
      .lean();

    const items = docs.map((d) => serializePost(d));
    const suggestions = items.map((d) => ({
      slug: d.slug,
      title: d.title,
      company: d.company,
      role: d.role,
    }));
    return ok({ items, suggestions, engine: "mongodb", total: items.length });
  } catch (err) {
    return handleApiError(err);
  }
}
