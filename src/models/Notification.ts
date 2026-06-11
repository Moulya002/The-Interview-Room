import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: ["comment", "reply", "upvote", "follow", "mention", "system"],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export type INotification = InferSchemaType<typeof NotificationSchema> & {
  _id: string;
};

export const Notification: Model<INotification> =
  (models.Notification as Model<INotification>) ||
  model<INotification>("Notification", NotificationSchema);
