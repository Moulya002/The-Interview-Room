import Typesense from "typesense";

const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST;
const port = Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? "443");
const protocol = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? "https";

export const POSTS_COLLECTION = "interview_posts";

export const isTypesenseEnabled = Boolean(host && process.env.TYPESENSE_ADMIN_KEY);

/** Admin client (server-side only) — full read/write access. */
export function getAdminClient() {
  if (!host) throw new Error("Typesense host is not configured");
  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey: process.env.TYPESENSE_ADMIN_KEY ?? "",
    connectionTimeoutSeconds: 5,
  });
}

/** Search-only client (safe for the browser via a scoped search key). */
export function getSearchClient() {
  if (!host) throw new Error("Typesense host is not configured");
  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY ?? "",
    connectionTimeoutSeconds: 5,
  });
}

export const postsSchema = {
  name: POSTS_COLLECTION,
  fields: [
    { name: "title", type: "string" as const },
    { name: "company", type: "string" as const, facet: true },
    { name: "companySlug", type: "string" as const },
    { name: "role", type: "string" as const, facet: true },
    { name: "roleSlug", type: "string" as const },
    { name: "location", type: "string" as const, facet: true, optional: true },
    { name: "experienceLevel", type: "string" as const, facet: true },
    { name: "interviewType", type: "string" as const, facet: true },
    { name: "outcome", type: "string" as const, facet: true },
    { name: "difficulty", type: "int32" as const, facet: true },
    { name: "tags", type: "string[]" as const, facet: true, optional: true },
    { name: "questions", type: "string[]" as const, optional: true },
    { name: "content", type: "string" as const, optional: true },
    { name: "slug", type: "string" as const },
    { name: "score", type: "int32" as const },
    { name: "createdAt", type: "int64" as const },
  ],
  default_sorting_field: "createdAt",
};

export interface PostDocument {
  id: string;
  title: string;
  company: string;
  companySlug: string;
  role: string;
  roleSlug: string;
  location?: string;
  experienceLevel: string;
  interviewType: string;
  outcome: string;
  difficulty: number;
  tags?: string[];
  questions?: string[];
  content?: string;
  slug: string;
  score: number;
  createdAt: number;
}
