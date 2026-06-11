import { NextRequest } from "next/server";
import {
  ok,
  fail,
  handleApiError,
  requireUser,
  ApiError,
} from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { User, Notification } from "@/models";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    await connectDB();
    const { id } = await params;
    if (id === user.id) throw new ApiError("You cannot follow yourself", 400);

    const target = await User.findById(id);
    if (!target) return fail("User not found", 404);

    const isFollowing = (target.followers ?? []).some(
      (f: any) => String(f) === user.id,
    );

    if (isFollowing) {
      await User.updateOne({ _id: id }, { $pull: { followers: user.id } });
      await User.updateOne({ _id: user.id }, { $pull: { following: id } });
      return ok({ following: false });
    }

    await User.updateOne({ _id: id }, { $addToSet: { followers: user.id } });
    await User.updateOne({ _id: user.id }, { $addToSet: { following: id } });
    await Notification.create({
      userId: id,
      actorId: user.id,
      type: "follow",
      message: `${user.name ?? "Someone"} started following you`,
      link: `/profile/${user.id}`,
    });
    return ok({ following: true });
  } catch (err) {
    return handleApiError(err);
  }
}
