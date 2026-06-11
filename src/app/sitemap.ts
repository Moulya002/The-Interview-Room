import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/companies",
    "/roles",
    "/search",
    "/create",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    await connectDB();
    const posts = await Post.find({ isRemoved: false })
      .select("slug companySlug roleSlug updatedAt")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${baseUrl}/post/${p.slug}`,
      lastModified: new Date((p as any).updatedAt ?? Date.now()),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const companySlugs = [...new Set(posts.map((p) => p.companySlug))];
    const roleSlugs = [...new Set(posts.map((p) => p.roleSlug))];

    const companyRoutes: MetadataRoute.Sitemap = companySlugs.map((slug) => ({
      url: `${baseUrl}/company/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    const roleRoutes: MetadataRoute.Sitemap = roleSlugs.map((slug) => ({
      url: `${baseUrl}/role/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...companyRoutes, ...roleRoutes, ...postRoutes];
  } catch {
    return staticRoutes;
  }
}
