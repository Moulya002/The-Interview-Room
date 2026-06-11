"use client";

import { useSession, signIn } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard, PostCardSkeleton } from "@/components/post/post-card";
import { api } from "@/lib/fetcher";
import type { Paginated, PostDTO } from "@/types";

export default function BookmarksPage() {
  const { status } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.get<Paginated<PostDTO>>("/api/bookmarks?limit=30"),
    enabled: status === "authenticated",
  });

  if (status === "unauthenticated") {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Bookmark className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Sign in to view your bookmarks.</p>
        <Button onClick={() => signIn()}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Bookmark className="h-6 w-6" /> Bookmarks
      </h1>

      {isLoading || status === "loading" ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          You haven&apos;t saved any experiences yet.
        </p>
      ) : (
        <div className="space-y-4">
          {data?.items.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
