import Link from "next/link";
import { MessagesSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessagesSquare className="h-4 w-4" />
          <span>The Interview Room — Learn from real interviews.</span>
        </div>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/companies" className="hover:text-foreground">
            Companies
          </Link>
          <Link href="/roles" className="hover:text-foreground">
            Roles
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          <Link href="/create" className="hover:text-foreground">
            Share
          </Link>
        </nav>
      </div>
    </footer>
  );
}
