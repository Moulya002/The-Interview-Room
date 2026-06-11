import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const BookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  },
  { timestamps: true },
);

BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

export type IBookmark = InferSchemaType<typeof BookmarkSchema> & { _id: string };

export const Bookmark: Model<IBookmark> =
  (models.Bookmark as Model<IBookmark>) ||
  model<IBookmark>("Bookmark", BookmarkSchema);
