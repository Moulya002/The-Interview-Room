"use client";

import Link from "next/link";
import { MessagesSquare, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { SearchCommand } from "@/components/search-command";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { useUIStore } from "@/store/ui-store";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/companies", label: "Companies" },
  { href: "/roles", label: "Roles" },
];

export function Navbar() {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline">The Interview Room</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Button key={l.href} variant="ghost" size="sm" asChild>
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
        </nav>

        <button
          onClick={() => setSearchOpen(true)}
          className="ml-auto hidden w-full max-w-sm items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search experiences...</span>
          <kbd className="ml-auto rounded border bg-background px-1.5 text-xs">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/create">
              <PlusCircle className="h-4 w-4" /> Share
            </Link>
          </Button>
          <NotificationsBell />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
      <SearchCommand />
    </header>
  );
}
