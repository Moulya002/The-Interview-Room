import Link from "next/link";
import { Building2, Briefcase, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        removed. Try one of these instead:
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/companies">
            <Building2 className="h-4 w-4" /> Companies
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/roles">
            <Briefcase className="h-4 w-4" /> Roles
          </Link>
        </Button>
      </div>
    </div>
  );
}
