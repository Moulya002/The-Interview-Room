import { z } from "zod";
import {
  OUTCOMES,
  INTERVIEW_TYPES,
  EXPERIENCE_LEVELS,
  REPORT_REASONS,
} from "@/lib/constants";

export const roundSchema = z.object({
  title: z.string().min(1, "Round title is required"),
  type: z.string().optional().default(""),
  description: z.string().optional().default(""),
  questions: z.array(z.string()).optional().default([]),
});

export const postBaseSchema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters").max(160),
  company: z.string().min(1, "Company is required").max(80),
  role: z.string().min(1, "Role is required").max(80),
  location: z.string().max(120).optional().default(""),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  interviewType: z.enum(INTERVIEW_TYPES).optional().default("Onsite"),
  interviewDate: z.string().optional().nullable(),
  rounds: z.coerce.number().int().min(1).max(20).default(1),
  roundBreakdown: z.array(roundSchema).optional().default([]),
  outcome: z.enum(OUTCOMES).default("Pending"),
  difficulty: z.coerce.number().int().min(1).max(10).default(5),
  salaryMin: z.coerce.number().nonnegative().optional().nullable(),
  salaryMax: z.coerce.number().nonnegative().optional().nullable(),
  salaryCurrency: z.string().optional().default("USD"),
  preparationResources: z.array(z.string()).optional().default([]),
  questions: z.array(z.string()).optional().default([]),
  tips: z.string().max(5000).optional().default(""),
  content: z.string().max(20000).optional().default(""),
  tags: z.array(z.string()).max(10).optional().default([]),
  isAnonymous: z.boolean().optional().default(false),
});

const salaryRefinement = (d: { salaryMin?: number | null; salaryMax?: number | null }) =>
  !d.salaryMin || !d.salaryMax || d.salaryMax >= d.salaryMin;

export const createPostSchema = postBaseSchema.refine(salaryRefinement, {
  message: "Max salary must be greater than min",
  path: ["salaryMax"],
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Partial is applied to the un-refined base schema (Zod can't partial a refined one).
export const updatePostSchema = postBaseSchema.partial();

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
  parentCommentId: z.string().optional().nullable(),
  isAnonymous: z.boolean().optional().default(false),
});

export const voteSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(["post", "comment"]),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const reportSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(["post", "comment", "user"]),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(1000).optional().default(""),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  bio: z.string().max(280).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});
