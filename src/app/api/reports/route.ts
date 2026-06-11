import { NextRequest } from "next/server";
import { ok, handleApiError, requireUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Report } from "@/models";
import { reportSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const data = reportSchema.parse(await req.json());
    await Report.create({ ...data, reporterId: user.id });
    return ok({ reported: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
