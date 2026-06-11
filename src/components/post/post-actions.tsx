"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  Bookmark,
  Flag,
  Pencil,
  Share2,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "@/components/report-dialog";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PostDTO } from "@/types";

export function PostActions({ post }: { post: PostDTO }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [bookmarked, setBookmarked] = React.useState(post.isBookmarked);
  const [copied, setCopied] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const isOwner = session?.user?.id === post.author?._id;
  const isAdmin = session?.user?.role === "admin";

  const toggleBookmark = async () => {
    if (status !== "authenticated") return signIn();
    setBookmarked((b) => !b);
    try {
      const res = await api.post<{ bookmarked: boolean }>("/api/bookmarks", {
        postId: post._id,
      });
      setBookmarked(res.bookmarked);
    } catch {
      setBookmarked((b) => !b);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* user dismissed share sheet */
    }
  };

  const remove = async () => {
    if (!confirm("Delete this experience?")) return;
    try {
      await api.delete(`/api/posts/${post.slug}`);
      toast({ title: "Experience deleted" });
      router.push("/");
    } catch {
      toast({ title: "Could not delete", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={bookmarked ? "default" : "outline"}
        size="sm"
        onClick={toggleBookmark}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        {bookmarked ? "Saved" : "Save"}
      </Button>
      <Button variant="outline" size="sm" onClick={share}>
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Copied" : "Share"}
      </Button>

      {(isOwner || isAdmin) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <DropdownMenuItem onClick={() => router.push(`/post/${post.slug}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
        <Flag className="h-4 w-4" /> Report
      </Button>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={post._id}
        targetType="post"
      />
    </div>
  );
}
