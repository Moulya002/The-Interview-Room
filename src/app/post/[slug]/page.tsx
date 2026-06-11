import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Layers,
  Eye,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VoteButtons } from "@/components/post/vote-buttons";
import { OutcomeBadge } from "@/components/post/outcome-badge";
import { DifficultyMeter } from "@/components/post/difficulty-meter";
import { PostActions } from "@/components/post/post-actions";
import { AuthorByline } from "@/components/post/author-byline";
import { CommentSection } from "@/components/comments/comment-section";
import { getPostBySlug } from "@/lib/server-data";
import { formatSalary, timeAgo, formatCompact } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Experience not found" };
  const description = `${post.role} interview at ${post.company}. Difficulty ${post.difficulty}/10, outcome: ${post.outcome}. ${post.rounds} rounds.`;
  return {
    title: post.title,
    description,
    openGraph: { title: post.title, description, type: "article" },
    alternates: { canonical: `/post/${post.slug}` },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const salary = formatSalary(post.salaryMin, post.salaryMax, post.salaryCurrency);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.createdAt,
    author: { "@type": "Person", name: post.author?.name ?? "Anonymous" },
    about: `${post.role} interview at ${post.company}`,
    keywords: (post.tags ?? []).join(", "),
  };

  return (
    <div className="container max-w-4xl py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href={`/company/${post.companySlug}`} className="hover:text-foreground">
          {post.company}
        </Link>
        <span>/</span>
        <span className="text-foreground">{post.role}</span>
      </nav>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="hidden sm:block">
              <VoteButtons
                targetId={post._id}
                targetType="post"
                initialScore={post.score}
                initialVote={post.userVote}
              />
            </div>
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href={`/company/${post.companySlug}`}
                  className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
                >
                  <Building2 className="h-4 w-4" /> {post.company}
                </Link>
                <span>·</span>
                <Link
                  href={`/role/${post.roleSlug}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Briefcase className="h-4 w-4" /> {post.role}
                </Link>
              </div>

              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                {post.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <OutcomeBadge outcome={post.outcome} />
                <Badge variant="secondary">{post.experienceLevel}</Badge>
                <Badge variant="outline">{post.interviewType}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Layers className="h-3 w-3" /> {post.rounds} rounds
                </Badge>
                {post.location && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" /> {post.location}
                  </Badge>
                )}
                {salary && <Badge variant="outline">{salary}</Badge>}
                {post.interviewDate && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.interviewDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              <div className="mt-4">
                <DifficultyMeter value={post.difficulty} />
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <AuthorByline post={post} size="md" />
                  <span>· {timeAgo(post.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {formatCompact(post.views)}
                  </span>
                </div>
              </div>

              <Separator className="my-5" />
              <PostActions post={post} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Round breakdown */}
      {post.roundBreakdown && post.roundBreakdown.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Round-by-round breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {post.roundBreakdown.map((round, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Badge>{i + 1}</Badge>
                  <h3 className="font-semibold">{round.title}</h3>
                  {round.type && (
                    <Badge variant="outline">{round.type}</Badge>
                  )}
                </div>
                {round.description && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {round.description}
                  </p>
                )}
                {round.questions && round.questions.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {round.questions.map((q, j) => (
                      <li key={j}>{q}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      {post.questions && post.questions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Questions asked</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              {post.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Full story */}
      {post.content && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>The full story</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {post.content}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {post.tips && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Tips & advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {post.tips}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {post.preparationResources && post.preparationResources.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Preparation resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {post.preparationResources.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
              <Badge variant="secondary">#{tag}</Badge>
            </Link>
          ))}
        </div>
      )}

      <Separator className="my-8" />
      <CommentSection slug={post.slug} />
    </div>
  );
}
