import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Shield, LayoutDashboard } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin" && session.user.role !== "moderator") {
    redirect("/");
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Shield className="h-6 w-6 text-primary" /> Admin
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Moderation</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/analytics">
              <LayoutDashboard className="h-4 w-4" /> Analytics
            </Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
