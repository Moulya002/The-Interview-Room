import Link from "next/link";
import { PenSquare, Sparkles } from "lucide-react";
import { Feed } from "@/components/feed/feed";
import { TrendingSidebar } from "@/components/feed/trending-sidebar";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="container py-6">
      <section className="mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Real interview experiences from the community
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ace your next interview with{" "}
            <span className="text-primary">real stories</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Browse detailed interview experiences, discover commonly asked
            questions, and build a personalized preparation roadmap.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/create">
                <PenSquare className="h-4 w-4" /> Share your experience
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/companies">Explore companies</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <Feed />
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
