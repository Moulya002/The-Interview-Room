import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { REPORT_REASONS } from "@/lib/constants";

export { REPORT_REASONS };

const ReportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: { type: String, enum: ["post", "comment", "user"], required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

export type IReport = InferSchemaType<typeof ReportSchema> & { _id: string };

export const Report: Model<IReport> =
  (models.Report as Model<IReport>) || model<IReport>("Report", ReportSchema);
