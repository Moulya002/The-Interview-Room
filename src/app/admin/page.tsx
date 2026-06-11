"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Ban, ShieldCheck, Trash2, Check, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/fetcher";
import { timeAgo } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReportItem {
  _id: string;
  targetType: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  reporterId?: { name: string };
}
interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  reputation: number;
  isBanned: boolean;
}

function ReportsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.get<ReportItem[]>("/api/admin/reports?status=pending"),
  });

  const act = useMutation({
    mutationFn: (vars: { reportId: string; action: string }) =>
      api.patch("/api/admin/reports", vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({ title: "Report handled" });
    },
  });

  if (isLoading)
    return <Loader2 className="mx-auto my-12 h-6 w-6 animate-spin" />;

  if (!data?.length)
    return (
      <p className="py-12 text-center text-muted-foreground">
        No pending reports. 🎉
      </p>
    );

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={r._id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{r.reason}</Badge>
                <Badge variant="outline">{r.targetType}</Badge>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
              {r.details && <p className="mt-1 text-sm">{r.details}</p>}
              <p className="text-xs text-muted-foreground">
                Reported by {r.reporterId?.name ?? "unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => act.mutate({ reportId: r._id, action: "remove-content" })}
              >
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => act.mutate({ reportId: r._id, action: "resolve" })}
              >
                <Check className="h-4 w-4" /> Resolve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => act.mutate({ reportId: r._id, action: "dismiss" })}
              >
                <X className="h-4 w-4" /> Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<UserItem[]>("/api/admin/users"),
  });
  const act = useMutation({
    mutationFn: (vars: { userId: string; action: string }) =>
      api.patch("/api/admin/users", vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (isLoading)
    return <Loader2 className="mx-auto my-12 h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-2">
      {data?.map((u) => (
        <Card key={u._id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <p className="font-medium">
                {u.name}{" "}
                {u.role !== "user" && (
                  <Badge variant="secondary" className="ml-1">
                    {u.role}
                  </Badge>
                )}
                {u.isBanned && (
                  <Badge variant="destructive" className="ml-1">
                    banned
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {u.email} · {u.reputation} rep
              </p>
            </div>
            <div className="flex gap-2">
              {u.isBanned ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act.mutate({ userId: u._id, action: "unban" })}
                >
                  <ShieldCheck className="h-4 w-4" /> Unban
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => act.mutate({ userId: u._id, action: "ban" })}
                >
                  <Ban className="h-4 w-4" /> Ban
                </Button>
              )}
              {u.role === "user" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act.mutate({ userId: u._id, action: "promote" })}
                >
                  Promote
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act.mutate({ userId: u._id, action: "demote" })}
                >
                  Demote
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Tabs defaultValue="reports">
      <TabsList>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>
      <TabsContent value="reports">
        <ReportsTab />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab />
      </TabsContent>
    </Tabs>
  );
}
