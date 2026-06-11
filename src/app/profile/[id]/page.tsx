import { notFound } from "next/navigation";
import type { Metadata } from "next";
import mongoose from "mongoose";
import { Award, Calendar, MessageSquare, FileText } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User, Post } from "@/models";
import { serializePost } from "@/lib/serializers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/post/post-card";
import { FollowButton } from "@/components/profile/follow-button";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { getInitials } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProfile(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) return null;
  const posts = await Post.find({
    createdBy: id,
    isRemoved: false,
    isAnonymous: false,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("createdBy", "name avatar image reputation")
    .lean();
  return { user, posts: posts.map((p) => serializePost(p)) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getProfile(id);
  if (!data) return { title: "User not found" };
  return { title: `${data.user.name}'s profile` };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const data = await getProfile(id);
  if (!data) notFound();

  const session = await getServerSession(authOptions);
  const isOwn = session?.user?.id === id;
  const isFollowing = session?.user
    ? (data.user.followers ?? []).some((f: any) => String(f) === session.user.id)
    : false;

  const stats = [
    { icon: Award, label: "Reputation", value: data.user.reputation ?? 0 },
    { icon: FileText, label: "Post karma", value: data.user.postKarma ?? 0 },
    { icon: MessageSquare, label: "Comment karma", value: data.user.commentKarma ?? 0 },
  ];

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={data.user.avatar || data.user.image} />
              <AvatarFallback className="text-xl">
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{data.user.name}</h1>
              {data.user.bio && (
                <p className="mt-1 text-muted-foreground">{data.user.bio}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(data.user.createdAt as any).toLocaleDateString()}
                </span>
                <span>{data.user.followers?.length ?? 0} followers</span>
                <span>{data.user.following?.length ?? 0} following</span>
              </div>
            </div>
            <div>
              {isOwn ? (
                <EditProfileDialog
                  initialName={data.user.name}
                  initialBio={data.user.bio ?? ""}
                  initialAvatar={data.user.avatar ?? ""}
                />
              ) : (
                <FollowButton userId={id} initialFollowing={isFollowing} />
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border p-3 text-center">
                <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">
        Contributions ({data.posts.length})
      </h2>
      <div className="space-y-4">
        {data.posts.length === 0 ? (
          <p className="text-muted-foreground">No public contributions yet.</p>
        ) : (
          data.posts.map((p) => <PostCard key={p._id} post={p} />)
        )}
      </div>
    </div>
  );
}
