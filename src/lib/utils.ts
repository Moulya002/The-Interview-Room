import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert a free-text string into a URL-friendly slug. */
export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a reasonably-unique slug for a post. */
export function postSlug(company: string, role: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${slugify(company)}-${slugify(role)}-${rand}`;
}

/** Format a number compactly, e.g. 1200 -> "1.2k". */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

/** Relative time formatting, e.g. "3 hours ago". */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

/**
 * Reddit-style hot score used to rank trending posts. Combines vote score with
 * recency so fresh, well-received posts bubble to the top.
 */
export function hotScore(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000 - 1134028003;
  return Number((sign * order + seconds / 45000).toFixed(7));
}

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "USD",
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

export function difficultyLabel(d: number): string {
  if (d <= 3) return "Easy";
  if (d <= 6) return "Medium";
  if (d <= 8) return "Hard";
  return "Very Hard";
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const absoluteUrl = (path: string) =>
  `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}${path}`;
