"use client";

import * as React from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { api } from "@/lib/fetcher";
import { cn, formatCompact } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoteButtonsProps {
  targetId: string;
  targetType: "post" | "comment";
  initialScore: number;
  initialVote?: number;
  orientation?: "vertical" | "horizontal";
}

export function VoteButtons({
  targetId,
  targetType,
  initialScore,
  initialVote = 0,
  orientation = "vertical",
}: VoteButtonsProps) {
  const { status } = useSession();
  const { toast } = useToast();
  const [score, setScore] = React.useState(initialScore);
  const [vote, setVote] = React.useState(initialVote);
  const [pending, setPending] = React.useState(false);

  const cast = async (value: 1 | -1) => {
    if (status !== "authenticated") {
      signIn();
      return;
    }
    if (pending) return;
    const prevScore = score;
    const prevVote = vote;
    const nextVote = vote === value ? 0 : value;
    // Optimistic update.
    setVote(nextVote);
    setScore(score - prevVote + nextVote);
    setPending(true);
    try {
      const res = await api.post<{ score: number; userVote: number }>(
        "/api/votes",
        { targetId, targetType, value },
      );
      setScore(res.score);
      setVote(res.userVote);
    } catch {
      setScore(prevScore);
      setVote(prevVote);
      toast({ title: "Could not register your vote", variant: "destructive" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      <button
        onClick={() => cast(1)}
        aria-label="Upvote"
        className={cn(
          "rounded-md p-1 transition-colors hover:bg-primary/10 hover:text-primary",
          vote === 1 && "text-primary",
        )}
      >
        <ArrowBigUp className={cn("h-5 w-5", vote === 1 && "fill-primary")} />
      </button>
      <span
        className={cn(
          "min-w-[2ch] text-center text-sm font-semibold tabular-nums",
          vote === 1 && "text-primary",
          vote === -1 && "text-blue-500",
        )}
      >
        {formatCompact(score)}
      </span>
      <button
        onClick={() => cast(-1)}
        aria-label="Downvote"
        className={cn(
          "rounded-md p-1 transition-colors hover:bg-blue-500/10 hover:text-blue-500",
          vote === -1 && "text-blue-500",
        )}
      >
        <ArrowBigDown className={cn("h-5 w-5", vote === -1 && "fill-blue-500")} />
      </button>
    </div>
  );
}
