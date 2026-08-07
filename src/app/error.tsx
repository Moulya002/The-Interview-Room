"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. You can try again or head back home.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="h-4 w-4" /> Go home
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Error ref: {error.digest}</p>
      )}
    </div>
  );
}
