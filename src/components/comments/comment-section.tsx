"use client";

import * as React from "react";
import { signIn, useSession } from "next-auth/react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "@/components/comments/comment-item";
import { useComments, useAddComment } from "@/hooks/use-comments";

export function CommentSection({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const { data: comments, isLoading } = useComments(slug);
  const addComment = useAddComment(slug);
  const [draft, setDraft] = React.useState("");
  const [anonymous, setAnonymous] = React.useState(false);

  const submit = async () => {
    if (!draft.trim()) return;
    await addComment.mutateAsync({ content: draft, isAnonymous: anonymous });
    setDraft("");
  };

  const total = comments?.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0,
  );

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" /> Discussion
        {total ? <span className="text-muted-foreground">({total})</span> : null}
      </h2>

      {session?.user ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts or ask a question..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Comment anonymously
            </label>
            <Button onClick={submit} disabled={addComment.isPending || !draft.trim()}>
              {addComment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          <Button variant="link" onClick={() => signIn()} className="px-1">
            Sign in
          </Button>
          to join the discussion.
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="divide-y">
        {comments?.map((comment) => (
          <CommentItem key={comment._id} comment={comment} slug={slug} />
        ))}
      </div>

      {!isLoading && comments?.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}
    </section>
  );
}
