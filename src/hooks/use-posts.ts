"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { Paginated, PostDTO } from "@/types";
import type { FeedFilters } from "@/store/ui-store";

function buildQuery(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  return sp.toString();
}

export function useFeed(sort: string, filters: FeedFilters, limit = 10) {
  return useInfiniteQuery({
    queryKey: ["feed", sort, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<Paginated<PostDTO>>(
        `/api/posts?${buildQuery({ sort, page: pageParam, limit, ...filters })}`,
      ),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function usePost(slug: string, initialData?: PostDTO) {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: () => api.get<PostDTO>(`/api/posts/${slug}`),
    initialData,
  });
}

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      targetId: string;
      targetType: "post" | "comment";
      value: 1 | -1;
    }) => api.post<{ score: number; userVote: number }>("/api/votes", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post"] });
      qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

export function useBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      api.post<{ bookmarked: boolean }>("/api/bookmarks", { postId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });
}

export function useCreatePost() {
  return useMutation({
    mutationFn: (input: unknown) => api.post<PostDTO>("/api/posts", input),
  });
}
