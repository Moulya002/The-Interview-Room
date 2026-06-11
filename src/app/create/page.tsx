import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreatePostForm } from "@/components/post/create-post-form";

export const metadata = { title: "Share your interview experience" };

export default async function CreatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/create");

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Share your interview experience</h1>
        <p className="text-muted-foreground">
          Help the community by documenting your interview journey in detail.
        </p>
      </div>
      <CreatePostForm />
    </div>
  );
}
