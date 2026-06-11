"use client";

import Link from "next/link";
import { Building2, Briefcase, Hash, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/fetcher";

interface TrendingData {
  topCompanies: { name: string; slug: string; count: number }[];
  topRoles: { name: string; slug: string; count: number }[];
  trendingTags: { tag: string; count: number }[];
}

export function TrendingSidebar() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.get<TrendingData>("/api/trending"),
  });

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" /> Top Companies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))
            : data?.topCompanies.map((c) => (
                <Link
                  key={c.slug}
                  href={`/company/${c.slug}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.count}</span>
                </Link>
              ))}
          {!isLoading && !data?.topCompanies.length && (
            <p className="px-2 py-1 text-sm text-muted-foreground">No data yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-primary" /> Popular Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {data?.topRoles.map((r) => (
            <Link
              key={r.slug}
              href={`/role/${r.slug}`}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <span className="truncate">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.count}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {data?.trendingTags.map((t) => (
              <Link key={t.tag} href={`/search?q=${encodeURIComponent(t.tag)}`}>
                <Badge variant="secondary" className="gap-0.5">
                  <Hash className="h-3 w-3" />
                  {t.tag}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
