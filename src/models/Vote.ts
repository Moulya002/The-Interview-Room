import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const VoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: { type: String, enum: ["post", "comment"], required: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { timestamps: true },
);

// A user can only have one vote per target.
VoteSchema.index({ userId: 1, targetId: 1 }, { unique: true });

export type IVote = InferSchemaType<typeof VoteSchema> & { _id: string };

export const Vote: Model<IVote> =
  (models.Vote as Model<IVote>) || model<IVote>("Vote", VoteSchema);
