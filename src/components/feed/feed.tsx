"use client";

import * as React from "react";
import { Flame, Clock, TrendingUp, Loader2, Inbox } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard, PostCardSkeleton } from "@/components/post/post-card";
import { FeedFilters } from "@/components/feed/feed-filters";
import { useFeed } from "@/hooks/use-posts";
import { useUIStore, useFilterStore } from "@/store/ui-store";

export function Feed() {
  const { feedSort, setFeedSort } = useUIStore();
  const filters = useFilterStore((s) => s.filters);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(feedSort, filters);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <Tabs value={feedSort} onValueChange={(v) => setFeedSort(v as never)}>
          <TabsList>
            <TabsTrigger value="trending" className="gap-1.5">
              <Flame className="h-4 w-4" /> Trending
            </TabsTrigger>
            <TabsTrigger value="latest" className="gap-1.5">
              <Clock className="h-4 w-4" /> Latest
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-1.5">
              <TrendingUp className="h-4 w-4" /> Top
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <FeedFilters />
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load the feed. Please try again.
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <p className="font-medium">No experiences found</p>
          <p className="text-sm">Try adjusting your filters or be the first to share.</p>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-6">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-sm text-muted-foreground">You&apos;ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
