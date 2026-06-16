"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CornerDownRight, Pencil, Trash2, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/report-dialog";
import { getInitials, timeAgo, cn } from "@/lib/utils";
import { useAddComment, useEditComment, useDeleteComment } from "@/hooks/use-comments";
import type { CommentDTO } from "@/types";

interface CommentItemProps {
  comment: CommentDTO;
  slug: string;
  depth?: number;
}

export function CommentItem({ comment, slug, depth = 0 }: CommentItemProps) {
  const { data: session } = useSession();
  const [replying, setReplying] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [editDraft, setEditDraft] = React.useState(comment.content);

  const addComment = useAddComment(slug);
  const editComment = useEditComment(slug);
  const deleteComment = useDeleteComment(slug);

  const isOwner = session?.user?.id === comment.author?._id;
  const isAdmin = session?.user?.role === "admin";

  const submitReply = async () => {
    if (!draft.trim()) return;
    await addComment.mutateAsync({ content: draft, parentCommentId: comment._id });
    setDraft("");
    setReplying(false);
  };

  const submitEdit = async () => {
    if (!editDraft.trim()) return;
    await editComment.mutateAsync({ id: comment._id, content: editDraft });
    setEditing(false);
  };

  return (
    <div className={cn(depth > 0 && "ml-4 border-l pl-4 sm:ml-6")}>
      <div className="flex gap-3 py-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {comment.isAnonymous || !comment.author ? (
              <span className="font-medium text-foreground">Anonymous</span>
            ) : (
              <Link
                href={`/profile/${comment.author._id}`}
                className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={comment.author.avatar || comment.author.image} />
                  <AvatarFallback className="text-[9px]">
                    {getInitials(comment.author.name)}
                  </AvatarFallback>
                </Avatar>
                {comment.author.name}
              </Link>
            )}
            <span>· {timeAgo(comment.createdAt)}</span>
            {comment.isEdited && <span>· edited</span>}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitEdit} disabled={editComment.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap text-sm",
                comment.isRemoved && "italic text-muted-foreground",
              )}
            >
              {comment.content}
            </p>
          )}

          {!comment.isRemoved && !editing && (
            <div className="mt-1 flex items-center gap-1">
              {session?.user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setReplying((r) => !r)}
                >
                  <CornerDownRight className="h-3 w-3" /> Reply
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => {
                    setEditing(true);
                    setEditDraft(comment.content);
                  }}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              )}
              {(isOwner || isAdmin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-destructive"
                  onClick={() => deleteComment.mutate(comment._id)}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              )}
              {session?.user && !isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="h-3 w-3" /> Report
                </Button>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitReply} disabled={addComment.isPending}>
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentItem key={reply._id} comment={reply} slug={slug} depth={depth + 1} />
      ))}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={comment._id}
        targetType="comment"
      />
    </div>
  );
}
