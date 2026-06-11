import { NextRequest } from "next/server";
import { ok, handleApiError, requireUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();
    const items = await Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("actorId", "name avatar image")
      .lean();
    const unread = await Notification.countDocuments({
      userId: user.id,
      read: false,
    });
    return ok({ items, unread });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(_req: NextRequest) {
  try {
    const user = await requireUser();
    await connectDB();
    await Notification.updateMany(
      { userId: user.id, read: false },
      { $set: { read: true } },
    );
    return ok({ marked: true });
  } catch (err) {
    return handleApiError(err);
  }
}
