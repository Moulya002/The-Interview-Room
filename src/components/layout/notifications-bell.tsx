"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/fetcher";
import { timeAgo } from "@/lib/utils";

interface NotificationItem {
  _id: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const { status } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.get<{ items: NotificationItem[]; unread: number }>("/api/notifications"),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });

  if (status !== "authenticated") return null;

  const markRead = async () => {
    await api.patch("/api/notifications", {});
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && data?.unread && markRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {data && data.unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {data.unread > 9 ? "9+" : data.unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!data?.items?.length && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        )}
        {data?.items?.slice(0, 8).map((n) => (
          <DropdownMenuItem key={n._id} asChild>
            <Link href={n.link || "#"} className="flex flex-col items-start gap-0.5">
              <span className="text-sm">{n.message}</span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(n.createdAt)}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
