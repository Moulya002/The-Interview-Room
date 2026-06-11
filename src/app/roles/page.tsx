import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Roles",
  description: "Browse interview experiences by role.",
};

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await connectDB();
  const roles = await Post.aggregate([
    { $match: { isRemoved: false } },
    {
      $group: {
        _id: { role: "$role", slug: "$roleSlug" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 100 },
    { $project: { _id: 0, role: "$_id.role", slug: "$_id.slug", count: 1 } },
  ]);

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-2xl font-bold">Roles</h1>
      <p className="mb-6 text-muted-foreground">
        Find experiences for {roles.length} different roles.
      </p>

      {roles.length === 0 ? (
        <p className="text-muted-foreground">No roles yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r: any) => (
            <Link key={r.slug} href={`/role/${r.slug}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.count} experiences
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
