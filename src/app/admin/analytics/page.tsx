"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Users,
  FileText,
  MessageSquare,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/fetcher";

interface Stats {
  totals: { users: number; posts: number; comments: number; openReports: number };
  topCompanies: { company: string; slug: string; posts: number; views: number }[];
  topRoles: { role: string; slug: string; posts: number; comments: number }[];
  trendingTags: { tag: string; count: number }[];
  postGrowth: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
}

function MiniBars({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-32 items-end gap-1">
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground">No data in the last 30 days.</p>
      )}
      {data.map((d) => (
        <div
          key={d.date}
          className="group relative flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
          style={{ height: `${(d.count / max) * 100}%`, minHeight: "4px" }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  );
}

function RankList({
  items,
  primary,
  secondary,
}: {
  items: any[];
  primary: (i: any) => string;
  secondary: (i: any) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i[Object.keys(i).find((k) => typeof i[k] === "number")!]));
  return (
    <div className="space-y-2">
      {items.map((it, idx) => {
        const numericVal = it.views ?? it.comments ?? it.posts ?? 0;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="truncate">{primary(it)}</span>
              <span className="text-muted-foreground">{secondary(it)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${(numericVal / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<Stats>("/api/admin/stats"),
  });

  if (isLoading || !data)
    return <Loader2 className="mx-auto my-20 h-6 w-6 animate-spin" />;

  const totals = [
    { icon: Users, label: "Users", value: data.totals.users },
    { icon: FileText, label: "Posts", value: data.totals.posts },
    { icon: MessageSquare, label: "Comments", value: data.totals.comments },
    { icon: Flag, label: "Open reports", value: data.totals.openReports },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {totals.map((t) => (
          <Card key={t.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{t.value}</p>
                <p className="text-xs text-muted-foreground">{t.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post growth (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBars data={data.postGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User growth (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBars data={data.userGrowth} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most viewed companies</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList
              items={data.topCompanies}
              primary={(i) => i.company}
              secondary={(i) => `${i.views} views`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most discussed roles</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList
              items={data.topRoles}
              primary={(i) => i.role}
              secondary={(i) => `${i.comments} comments`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trending interview topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {data.trendingTags.map((t) => (
              <Badge key={t.tag} variant="secondary">
                #{t.tag} · {t.count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
