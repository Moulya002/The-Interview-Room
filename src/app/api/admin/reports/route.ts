import { NextRequest } from "next/server";
import { ok, handleApiError, requireAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Report, Post, Comment } from "@/models";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();
    const status = req.nextUrl.searchParams.get("status") ?? "pending";
    const reports = await Report.find(
      (status === "all" ? {} : { status }) as Record<string, unknown>,
    )
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("reporterId", "name avatar image")
      .lean();
    return ok(reports);
  } catch (err) {
    return handleApiError(err);
  }
}

const actionSchema = z.object({
  reportId: z.string(),
  action: z.enum(["dismiss", "resolve", "remove-content"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();
    const { reportId, action } = actionSchema.parse(await req.json());
    const report = await Report.findById(reportId);
    if (!report) return ok({ updated: false });

    if (action === "remove-content") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Model: any = report.targetType === "post" ? Post : Comment;
      if (report.targetType !== "user") {
        await Model.updateOne(
          { _id: report.targetId },
          { $set: { isRemoved: true } },
        );
      }
      report.status = "resolved";
    } else if (action === "resolve") {
      report.status = "resolved";
    } else {
      report.status = "dismissed";
    }
    report.resolvedBy = admin.id as any;
    await report.save();
    return ok({ updated: true, status: report.status });
  } catch (err) {
    return handleApiError(err);
  }
}
