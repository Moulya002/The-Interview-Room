"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Shield,
  User as UserIcon,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />;
  }

  if (!session?.user) {
    return (
      <Button size="sm" onClick={() => signIn()}>
        Sign in
      </Button>
    );
  }

  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-ring focus-visible:ring-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.reputation ?? 0} reputation
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/create">
            <PlusCircle /> Share experience
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.id}`}>
            <UserIcon /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookmarks">
            <Bookmark /> Bookmarks
          </Link>
        </DropdownMenuItem>
        {(user.role === "admin" || user.role === "moderator") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield /> Admin
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/analytics">
                <LayoutDashboard /> Analytics
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
