import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 280 },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    reputation: { type: Number, default: 0 },
    commentKarma: { type: Number, default: 0 },
    postKarma: { type: Number, default: 0 },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

UserSchema.virtual("followerCount").get(function () {
  return this.followers?.length ?? 0;
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export type IUser = InferSchemaType<typeof UserSchema> & { _id: string };

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
