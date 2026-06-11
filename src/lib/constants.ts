/**
 * Shared enum constants. Kept free of any Mongoose / server-only imports so
 * they can be safely used in client components without bundling the database
 * driver into the browser.
 */
export const OUTCOMES = ["Selected", "Rejected", "Pending"] as const;

export const INTERVIEW_TYPES = [
  "Onsite",
  "Virtual",
  "Phone Screen",
  "Take-home",
  "System Design",
  "Behavioral",
  "Coding",
] as const;

export const EXPERIENCE_LEVELS = [
  "Internship",
  "Entry Level",
  "Mid Level",
  "Senior",
  "Staff",
  "Principal",
] as const;

export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Misinformation",
  "Inappropriate",
  "Off-topic",
  "Other",
] as const;

export type Outcome = (typeof OUTCOMES)[number];
export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];
