import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(extra ? { details: extra } : {}) },
    { status },
  );
}

/** Centralised error handler for API route catch blocks. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("Validation failed", 422, err.flatten().fieldErrors);
  }
  console.error("[API_ERROR]", err);
  const message =
    err instanceof Error ? err.message : "Something went wrong";
  return fail(message, 500);
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** Throws a typed 401 when no session exists. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("You must be signed in to do that", 401);
  }
  if (user.isBanned) {
    throw new ApiError("Your account has been suspended", 403);
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "moderator") {
    throw new ApiError("Admin access required", 403);
  }
  return user;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) return fail(err.message, err.status);
  return handleError(err);
}

/** Parse common list query params (pagination + filters). */
export function parseListParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get("limit") ?? "10")),
  );
  return { page, limit, skip: (page - 1) * limit };
}
