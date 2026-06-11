"use client";

import * as React from "react";
import { useSession, signIn } from "next-auth/react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";

export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const { status } = useSession();
  const [following, setFollowing] = React.useState(initialFollowing);
  const [pending, setPending] = React.useState(false);

  const toggle = async () => {
    if (status !== "authenticated") return signIn();
    setPending(true);
    setFollowing((f) => !f);
    try {
      const res = await api.post<{ following: boolean }>(
        `/api/users/${userId}/follow`,
        {},
      );
      setFollowing(res.following);
    } catch {
      setFollowing((f) => !f);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={pending}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> Follow
        </>
      )}
    </Button>
  );
}
