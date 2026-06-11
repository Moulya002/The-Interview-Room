import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { computeStats } from "@/lib/aggregations";
import { serializePost } from "@/lib/serializers";
import { StatsOverview, TopQuestions } from "@/components/stats/stats-overview";
import { AIInsights } from "@/components/ai/ai-insights";
import { PostCard } from "@/components/post/post-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getData(slug: string) {
  await connectDB();
  const sample = await Post.findOne({ roleSlug: slug }).select("role").lean();
  if (!sample) return null;
  const stats = await computeStats({ roleSlug: slug });
  const posts = await Post.find({ roleSlug: slug, isRemoved: false })
    .sort({ score: -1, createdAt: -1 })
    .limit(15)
    .populate("createdBy", "name avatar image reputation")
    .lean();
  const topCompanies = await Post.aggregate([
    { $match: { roleSlug: slug, isRemoved: false } },
    { $group: { _id: { company: "$company", slug: "$companySlug" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $project: { _id: 0, company: "$_id.company", slug: "$_id.slug", count: 1 } },
  ]);
  return {
    name: sample.role,
    stats,
    topCompanies,
    posts: posts.map((p) => serializePost(p)),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) return { title: "Role not found" };
  return {
    title: `${data.name} Interview Experiences`,
    description: `Explore ${data.stats.total} ${data.name} interview experiences, common skills, and popular questions.`,
    alternates: { canonical: `/role/${slug}` },
  };
}

export default async function RolePage({ params }: Props) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) notFound();

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <p className="text-muted-foreground">Role interview insights</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <StatsOverview stats={data.stats} />
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
          <AIInsights role={data.name} />
          {data.topCompanies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Companies hiring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.topCompanies.map((c: any) => (
                  <Link
                    key={c.slug}
                    href={`/company/${c.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span>{c.company}</span>
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
          <div>
            <h2 className="mb-2 text-sm font-medium">Common skills & topics</h2>
            <div className="flex flex-wrap gap-1.5">
              {data.stats.topTags.map((t) => (
                <Link key={t.tag} href={`/search?q=${encodeURIComponent(t.tag)}`}>
                  <Badge variant="secondary">#{t.tag}</Badge>
                </Link>
              ))}
            </div>
          </div>
          <TopQuestions questions={data.stats.topQuestions} />
        </div>
      </div>
    </div>
  );
}
