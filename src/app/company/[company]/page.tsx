import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { computeStats } from "@/lib/aggregations";
import { serializePost } from "@/lib/serializers";
import { StatsOverview, TopQuestions } from "@/components/stats/stats-overview";
import { AIInsights } from "@/components/ai/ai-insights";
import { PostCard } from "@/components/post/post-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Props {
  params: Promise<{ company: string }>;
}

async function getData(slug: string) {
  await connectDB();
  const sample = await Post.findOne({ companySlug: slug }).select("company").lean();
  if (!sample) return null;
  const stats = await computeStats({ companySlug: slug });
  const posts = await Post.find({ companySlug: slug, isRemoved: false })
    .sort({ score: -1, createdAt: -1 })
    .limit(15)
    .populate("createdBy", "name avatar image reputation")
    .lean();
  return { name: sample.company, stats, posts: posts.map((p) => serializePost(p)) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await params;
  const data = await getData(company);
  if (!data) return { title: "Company not found" };
  return {
    title: `${data.name} Interview Experiences & Questions`,
    description: `${data.stats.total} real ${data.name} interview experiences. Average difficulty ${data.stats.avgDifficulty}/10. See commonly asked questions and outcomes.`,
    alternates: { canonical: `/company/${company}` },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { company } = await params;
  const data = await getData(company);
  if (!data) notFound();

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <p className="text-muted-foreground">Interview experiences & insights</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <StatsOverview stats={data.stats} />

          {data.stats.topTags.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium">Trending topics</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.stats.topTags.map((t) => (
                  <Link key={t.tag} href={`/search?q=${encodeURIComponent(t.tag)}`}>
                    <Badge variant="secondary">
                      #{t.tag} · {t.count}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold">Experiences</h2>
            <div className="space-y-4">
              {data.posts.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AIInsights company={data.name} />
          <TopQuestions questions={data.stats.topQuestions} />
        </div>
      </div>
    </div>
  );
}
