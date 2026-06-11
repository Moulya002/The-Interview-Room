import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import {
  OUTCOMES,
  INTERVIEW_TYPES,
  EXPERIENCE_LEVELS,
} from "@/lib/constants";

export { OUTCOMES, INTERVIEW_TYPES, EXPERIENCE_LEVELS };

const RoundSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, default: "" }, // e.g. "Technical", "HR", "System Design"
    description: { type: String, default: "" },
    questions: [{ type: String }],
  },
  { _id: false },
);

const PostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    company: { type: String, required: true, index: true, trim: true },
    companySlug: { type: String, required: true, index: true },
    role: { type: String, required: true, index: true, trim: true },
    roleSlug: { type: String, required: true, index: true },
    location: { type: String, default: "", index: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, required: true },
    interviewType: { type: String, enum: INTERVIEW_TYPES, default: "Onsite" },
    interviewDate: { type: Date },
    rounds: { type: Number, default: 1, min: 1 },
    roundBreakdown: [RoundSchema],
    outcome: { type: String, enum: OUTCOMES, default: "Pending", index: true },
    difficulty: { type: Number, min: 1, max: 10, default: 5, index: true },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    salaryCurrency: { type: String, default: "USD" },
    preparationResources: [{ type: String }],
    questions: [{ type: String }],
    tips: { type: String, default: "" },
    content: { type: String, default: "" },
    tags: [{ type: String, index: true }],

    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isAnonymous: { type: Boolean, default: false },

    upvotes: { type: Number, default: 0, index: true },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0, index: true },
    commentCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },

    isRemoved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // Attribution for imported (non-native) content.
    source: { type: String, default: "" }, // e.g. "reddit", "dataset"
    sourceUrl: { type: String, default: "" },
    sourceAuthor: { type: String, default: "" },
    sourceId: { type: String, default: "", index: true }, // for dedupe
  },
  { timestamps: true },
);

// Full-text index used as a fallback when Typesense is not configured.
PostSchema.index({
  title: "text",
  company: "text",
  role: "text",
  content: "text",
  tips: "text",
  tags: "text",
  questions: "text",
});

// Hot ranking: a simple time-decayed score for the "trending" feed.
PostSchema.index({ score: -1, createdAt: -1 });

export type IPost = InferSchemaType<typeof PostSchema> & { _id: string };

export const Post: Model<IPost> =
  (models.Post as Model<IPost>) || model<IPost>("Post", PostSchema);
