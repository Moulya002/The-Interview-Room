import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const CommentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isAnonymous: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    isRemoved: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type IComment = InferSchemaType<typeof CommentSchema> & { _id: string };

export const Comment: Model<IComment> =
  (models.Comment as Model<IComment>) ||
  model<IComment>("Comment", CommentSchema);
