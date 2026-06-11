import Link from "next/link";
import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Companies",
  description: "Browse interview experiences by company.",
};

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  await connectDB();
  const companies = await Post.aggregate([
    { $match: { isRemoved: false } },
    {
      $group: {
        _id: { company: "$company", slug: "$companySlug" },
        count: { $sum: 1 },
        avgDifficulty: { $avg: "$difficulty" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 100 },
    {
      $project: {
        _id: 0,
        company: "$_id.company",
        slug: "$_id.slug",
        count: 1,
        avgDifficulty: { $round: ["$avgDifficulty", 1] },
      },
    },
  ]);

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-2xl font-bold">Companies</h1>
      <p className="mb-6 text-muted-foreground">
        Explore interview experiences across {companies.length} companies.
      </p>

      {companies.length === 0 ? (
        <p className="text-muted-foreground">No companies yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c: any) => (
            <Link key={c.slug} href={`/company/${c.slug}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.count} experiences · avg {c.avgDifficulty}/10
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
