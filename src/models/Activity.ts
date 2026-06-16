import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const ACTIVITY_TYPES = ["post", "comment"] as const;

/**
 * Append-only log of user actions. We record one row every time a user creates
 * a post or a comment so the database keeps a durable history of who is
 * participating and how (useful for analytics like "how many users commented").
 */
const ActivitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    type: { type: String, enum: ACTIVITY_TYPES, required: true, index: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    postSlug: { type: String, default: "" },
  },
  { timestamps: true },
);

export type IActivity = InferSchemaType<typeof ActivitySchema> & { _id: string };

export const Activity: Model<IActivity> =
  (models.Activity as Model<IActivity>) ||
  model<IActivity>("Activity", ActivitySchema);
