"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.57 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.3-5.47-5.79 0-1.28.47-2.33 1.24-3.15-.13-.3-.54-1.5.12-3.13 0 0 1.01-.32 3.3 1.2.96-.26 1.98-.39 3-.4 1.02 0 2.04.14 3 .4 2.28-1.52 3.29-1.2 3.29-1.2.66 1.63.25 2.83.12 3.13.77.82 1.24 1.87 1.24 3.15 0 4.5-2.81 5.49-5.49 5.78.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .32.21.69.83.57A12.01 12.01 0 0024 12.29C24 5.78 18.63.5 12 .5z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.08 1.08-2.76 2.27-5.7 2.27-4.55 0-8.11-3.66-8.11-8.21s3.56-8.21 8.11-8.21c2.46 0 4.25.97 5.57 2.21l2.31-2.31C18.66 1.39 16.13.25 12.48.25 6.42.25 1.5 5.17 1.5 11.23s4.92 10.98 10.98 10.98c3.27 0 5.74-1.08 7.66-3.08 1.98-1.98 2.6-4.76 2.6-7.01 0-.7-.05-1.34-.16-1.88l-10.1.01z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  React.useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MessagesSquare className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to share experiences, vote, and join the discussion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <GoogleIcon /> Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl })}
          >
            <GithubIcon /> Continue with GitHub
          </Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            By continuing you agree to our community guidelines. You can also
            post anonymously after signing in.
          </p>
          <p className="text-center text-sm">
            <Link href="/" className="text-primary hover:underline">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
