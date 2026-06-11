import { NextRequest } from "next/server";
import { ok, fail, handleApiError } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { slugify } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const FEATURES = ["summary", "questions", "roadmap"] as const;
type Feature = (typeof FEATURES)[number];

const bodySchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  count: z.coerce.number().int().min(1).max(20).optional(),
});

interface Ctx {
  params: Promise<{ feature: string }>;
}

const AI_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { feature } = await params;
    if (!FEATURES.includes(feature as Feature)) {
      return fail("Unknown AI feature", 404);
    }

    const body = bodySchema.parse(await req.json().catch(() => ({})));
    await connectDB();

    const filter: Record<string, unknown> = { isRemoved: false };
    if (body.company) filter.companySlug = slugify(body.company);
    if (body.role) filter.roleSlug = slugify(body.role);

    // Gather the source experiences the model will reason over.
    const posts = await Post.find(filter)
      .sort({ score: -1, createdAt: -1 })
      .limit(60)
      .select("title company role difficulty outcome questions tags content tips roundBreakdown experienceLevel")
      .lean();

    const payload = {
      company: body.company ?? null,
      role: body.role ?? null,
      count: body.count ?? 8,
      experiences: posts.map((p) => ({
        company: p.company,
        role: p.role,
        difficulty: p.difficulty,
        outcome: p.outcome,
        questions: p.questions ?? [],
        tags: p.tags ?? [],
        tips: p.tips ?? "",
        rounds: (p.roundBreakdown ?? []).map((r: any) => r.title),
      })),
    };

    try {
      const res = await fetch(`${AI_URL}/${feature}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`AI service returned ${res.status}`);
      const data = await res.json();
      return ok({ ...data, source: "ai-service" });
    } catch (err) {
      console.error("[AI_SERVICE_FALLBACK]", err);
      return ok({ ...localFallback(feature as Feature, payload), source: "fallback" });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

/** Lightweight heuristic results so the UI still works without the AI service. */
function localFallback(feature: Feature, payload: any) {
  const allQuestions: string[] = payload.experiences.flatMap((e: any) => e.questions);
  const allTags: string[] = payload.experiences.flatMap((e: any) => e.tags);
  const freq = (arr: string[]) => {
    const m = new Map<string, number>();
    arr.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const topQuestions = freq(allQuestions).slice(0, payload.count).map(([q]) => q);
  const topTopics = freq(allTags).slice(0, 8).map(([t]) => t);
  const avgDifficulty =
    payload.experiences.reduce((s: number, e: any) => s + (e.difficulty ?? 0), 0) /
    (payload.experiences.length || 1);

  if (feature === "summary") {
    return {
      mostAskedQuestions: topQuestions,
      commonTopics: topTopics,
      difficultySummary: `Average difficulty ${avgDifficulty.toFixed(1)}/10 across ${payload.experiences.length} experiences.`,
    };
  }
  if (feature === "questions") {
    return {
      questions:
        topQuestions.length > 0
          ? topQuestions
          : ["Tell me about a challenging project you worked on.", "Explain a system you designed."],
    };
  }
  return {
    roadmap: [
      { week: 1, focus: "Fundamentals", topics: topTopics.slice(0, 3) },
      { week: 2, focus: "Core practice", topics: topTopics.slice(3, 6) },
      { week: 3, focus: "Mock interviews", topics: ["Behavioral", "System design"] },
      { week: 4, focus: "Company-specific review", topics: topQuestions.slice(0, 5) },
    ],
  };
}
