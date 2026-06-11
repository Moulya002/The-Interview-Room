"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search as SearchIcon, Loader2, Building2, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OutcomeBadge } from "@/components/post/outcome-badge";
import { api } from "@/lib/fetcher";

interface SearchResult {
  id?: string;
  _id?: string;
  slug: string;
  title: string;
  company: string;
  role: string;
  difficulty?: number;
  outcome?: string;
  tags?: string[];
}

function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [input, setInput] = React.useState(q);

  const { data, isFetching } = useQuery({
    queryKey: ["search-full", q],
    queryFn: () =>
      api.get<{ items: SearchResult[]; engine: string; total: number }>(
        `/api/search?mode=full&limit=20&q=${encodeURIComponent(q)}`,
      ),
    enabled: q.length > 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) router.push(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="container max-w-3xl py-8">
      <form onSubmit={submit} className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search companies, roles, questions, keywords..."
            className="pl-9"
            autoFocus
          />
        </div>
      </form>

      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          {isFetching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </span>
          ) : (
            <>
              {data?.total ?? 0} results for &ldquo;{q}&rdquo;
              {data?.engine && (
                <span className="ml-2 text-xs">· via {data.engine}</span>
              )}
            </>
          )}
        </p>
      )}

      <div className="space-y-3">
        {data?.items.map((r) => {
          const id = r._id ?? r.id;
          return (
            <Link key={id} href={`/post/${r.slug}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="p-4">
                  <h3 className="mb-1 font-semibold hover:text-primary">{r.title}</h3>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {r.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {r.role}
                    </span>
                    {r.outcome && <OutcomeBadge outcome={r.outcome} />}
                    {r.difficulty !== undefined && (
                      <Badge variant="outline">{r.difficulty}/10</Badge>
                    )}
                  </div>
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.slice(0, 5).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[11px]">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {q && !isFetching && data?.items.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          No results found. Try different keywords.
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
