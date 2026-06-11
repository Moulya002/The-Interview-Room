"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { CommentDTO } from "@/types";

export function useComments(slug: string) {
  return useQuery({
    queryKey: ["comments", slug],
    queryFn: () => api.get<CommentDTO[]>(`/api/posts/${slug}/comments`),
  });
}

export function useAddComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      content: string;
      parentCommentId?: string | null;
      isAnonymous?: boolean;
    }) => api.post<CommentDTO>(`/api/posts/${slug}/comments`, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", slug] }),
  });
}

export function useEditComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; content: string }) =>
      api.patch<CommentDTO>(`/api/comments/${vars.id}`, {
        content: vars.content,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", slug] }),
  });
}

export function useDeleteComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/api/comments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", slug] }),
  });
}
