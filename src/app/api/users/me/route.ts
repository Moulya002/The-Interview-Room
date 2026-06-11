import { NextRequest } from "next/server";
import { ok, handleApiError, requireUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { updateProfileSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();
    const doc = await User.findById(user.id).lean();
    return ok(doc);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    const data = updateProfileSchema.parse(await req.json());
    const updated = await User.findByIdAndUpdate(
      user.id,
      { $set: data },
      { new: true },
    ).lean();
    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
