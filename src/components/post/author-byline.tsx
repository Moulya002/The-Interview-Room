import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { PostDTO } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  hackernews: "Hacker News",
  dataset: "Open dataset",
};

/**
 * Renders the post byline: a real author link, a source attribution link for
 * imported content, or an anonymous label.
 */
export function AuthorByline({
  post,
  size = "sm",
}: {
  post: PostDTO;
  size?: "sm" | "md";
}) {
  const avatarSize = size === "md" ? "h-7 w-7" : "h-6 w-6";

  if (!post.isAnonymous && post.author) {
    return (
      <Link
        href={`/profile/${post.author._id}`}
        className="flex items-center gap-1.5 hover:text-foreground"
      >
        <Avatar className={avatarSize}>
          <AvatarImage src={post.author.avatar || post.author.image} />
          <AvatarFallback className="text-[10px]">
            {getInitials(post.author.name)}
          </AvatarFallback>
        </Avatar>
        {post.author.name}
      </Link>
    );
  }

  if (post.source && post.sourceUrl) {
    const label = SOURCE_LABELS[post.source] ?? post.source;
    return (
      <a
        href={post.sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex items-center gap-1 hover:text-foreground"
        title={`Originally posted on ${label}`}
      >
        <span className="flex items-center gap-1">
          via <span className="font-medium text-foreground">{label}</span>
          {post.sourceAuthor && (
            <span className="text-muted-foreground">· {post.sourceAuthor}</span>
          )}
        </span>
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
        ?
      </span>
      Anonymous
    </span>
  );
}
