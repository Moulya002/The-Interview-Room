import Link from "next/link";
import {
  Building2,
  MapPin,
  MessageSquare,
  Layers,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteButtons } from "@/components/post/vote-buttons";
import { OutcomeBadge } from "@/components/post/outcome-badge";
import { DifficultyMeter } from "@/components/post/difficulty-meter";
import { AuthorByline } from "@/components/post/author-byline";
import { cn, formatCompact, formatSalary, timeAgo } from "@/lib/utils";
import type { PostDTO } from "@/types";

export function PostCard({ post }: { post: PostDTO }) {
  const salary = formatSalary(post.salaryMin, post.salaryMax, post.salaryCurrency);

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/40">
      <div className="flex">
        <div className="flex flex-col items-center gap-1 border-r bg-muted/30 px-2 py-4">
          <VoteButtons
            targetId={post._id}
            targetType="post"
            initialScore={post.score}
            initialVote={post.userVote}
          />
        </div>

        <div className="flex-1 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={`/company/${post.companySlug}`}
              className="flex items-center gap-1 font-medium text-foreground hover:text-primary"
            >
              <Building2 className="h-3.5 w-3.5" /> {post.company}
            </Link>
            <span>·</span>
            <Link
              href={`/role/${post.roleSlug}`}
              className="flex items-center gap-1 hover:text-primary"
            >
              <Briefcase className="h-3.5 w-3.5" /> {post.role}
            </Link>
            {post.location && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {post.location}
                </span>
              </>
            )}
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>

          <Link href={`/post/${post.slug}`}>
            <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-snug hover:text-primary">
              {post.title}
            </h3>
          </Link>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <OutcomeBadge outcome={post.outcome} />
            <Badge variant="secondary">{post.experienceLevel}</Badge>
            <Badge variant="outline">{post.interviewType}</Badge>
            <Badge variant="outline" className="gap-1">
              <Layers className="h-3 w-3" /> {post.rounds} rounds
            </Badge>
            {salary && <Badge variant="outline">{salary}</Badge>}
          </div>

          <div className="mb-3">
            <DifficultyMeter value={post.difficulty} />
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 5).map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="text-[11px]">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AuthorByline post={post} />
            </div>
            <Link
              href={`/post/${post.slug}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              {formatCompact(post.commentCount)} comments
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PostCardSkeleton() {
  return (
    <Card className={cn("flex animate-pulse", "h-44")}>
      <div className="w-12 border-r bg-muted/30" />
      <div className="flex-1 space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </Card>
  );
}
