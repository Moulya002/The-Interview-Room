import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostBySlug } from "@/lib/server-data";
import { CreatePostForm } from "@/components/post/create-post-form";

export const metadata = { title: "Edit experience" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/post/${slug}/edit`);

  const post = await getPostBySlug(slug);
  if (!post) notFound();
  if (post.author?._id !== session.user.id && session.user.role !== "admin") {
    redirect(`/post/${slug}`);
  }

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit experience</h1>
      <CreatePostForm post={post} />
    </div>
  );
}
