import { NextRequest } from "next/server";
import { ok, handleApiError, requireAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const filter = q
      ? { $or: [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] }
      : {};
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .select("name email avatar image role reputation isBanned createdAt")
      .lean();
    return ok(users);
  } catch (err) {
    return handleApiError(err);
  }
}

const actionSchema = z.object({
  userId: z.string(),
  action: z.enum(["ban", "unban", "promote", "demote"]),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();
    const { userId, action } = actionSchema.parse(await req.json());
    const update: Record<string, unknown> = {};
    if (action === "ban") update.isBanned = true;
    if (action === "unban") update.isBanned = false;
    if (action === "promote") update.role = "moderator";
    if (action === "demote") update.role = "user";
    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select("name email role isBanned")
      .lean();
    return ok(user);
  } catch (err) {
    return handleApiError(err);
  }
}
