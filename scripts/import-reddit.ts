/**
 * Imports real interview experiences from public interview subreddits via
 * Reddit's public JSON API. Every imported post keeps a link back to the
 * original thread and credits the original author (source attribution).
 *
 * This is intended for personal / development use. It does NOT bypass any
 * authentication and respects Reddit's public read endpoints with a rate limit.
 *
 * Usage:  npm run import:reddit
 */
import { loadEnv } from "./load-env";
loadEnv();

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { postSlug, slugify } from "@/lib/utils";

const USER_AGENT =
  "the-interview-room/1.0 (interview experience aggregator; personal project)";

// Subreddits + search queries that surface interview experiences.
const SOURCES: { sub: string; query: string }[] = [
  { sub: "leetcode", query: "interview experience" },
  { sub: "cscareerquestions", query: "interview experience" },
  { sub: "csMajors", query: "interview experience" },
  { sub: "ExperiencedDevs", query: "interview" },
  { sub: "datascience", query: "interview experience" },
  { sub: "dataengineering", query: "interview" },
];

const COMPANIES = [
  "Google", "Amazon", "Meta", "Facebook", "Microsoft", "Apple", "Netflix",
  "Stripe", "Airbnb", "Uber", "Lyft", "LinkedIn", "Salesforce", "Oracle",
  "Adobe", "Nvidia", "Tesla", "Bloomberg", "Goldman Sachs", "Citadel",
  "Two Sigma", "Jane Street", "Databricks", "Snowflake", "Atlassian",
  "Shopify", "Coinbase", "Robinhood", "DoorDash", "Pinterest", "Snap",
  "Twitter", "TikTok", "ByteDance", "IBM", "Intel", "Cisco", "Qualcomm",
  "PayPal", "Square", "Block", "Palantir", "Roblox", "Reddit", "Dropbox",
  "Spotify", "Twilio", "Cloudflare", "MongoDB", "Datadog", "Wayfair",
  "Capital One", "JPMorgan", "Morgan Stanley", "Visa", "Mastercard",
  "Walmart", "Flipkart", "Swiggy", "Zomato", "Razorpay", "Zoho", "Infosys",
  "TCS", "Wipro", "Accenture", "Deloitte",
];

const ROLE_PATTERNS: [RegExp, string][] = [
  [/\b(sde|software (development )?engineer|swe)\b/i, "Software Engineer"],
  [/\bfront[\s-]?end\b/i, "Frontend Engineer"],
  [/\bback[\s-]?end\b/i, "Backend Engineer"],
  [/\bfull[\s-]?stack\b/i, "Full Stack Engineer"],
  [/\bdata engineer/i, "Data Engineer"],
  [/\bdata scientist|data science\b/i, "Data Scientist"],
  [/\b(ml|machine learning) engineer\b/i, "Machine Learning Engineer"],
  [/\bproduct manager|\bpm\b/i, "Product Manager"],
  [/\bdevops|sre|site reliability\b/i, "DevOps Engineer"],
  [/\bsecurity engineer\b/i, "Security Engineer"],
  [/\bmobile|android|ios\b/i, "Mobile Engineer"],
  [/\bdata analyst\b/i, "Data Analyst"],
];

const TAG_PATTERNS: [RegExp, string][] = [
  [/leetcode|\blc\b/i, "leetcode"],
  [/system design/i, "system-design"],
  [/behavioral|behavioural/i, "behavioral"],
  [/\bdsa\b|data structure|algorithm/i, "dsa"],
  [/\bsql\b/i, "sql"],
  [/dynamic programming|\bdp\b/i, "dynamic-programming"],
  [/\bgraph/i, "graphs"],
  [/machine learning|\bml\b/i, "machine-learning"],
  [/new grad|new-grad|newgrad/i, "new-grad"],
  [/intern(ship)?/i, "internship"],
  [/coding/i, "coding"],
  [/take[\s-]?home/i, "take-home"],
];

interface RedditChild {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    ups: number;
    num_comments: number;
    created_utc: number;
    over_18: boolean;
    stickied: boolean;
  };
}

function detectCompany(text: string): string | null {
  for (const c of COMPANIES) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) return c === "Facebook" ? "Meta" : c;
  }
  return null;
}

function detectRole(text: string): string {
  for (const [re, role] of ROLE_PATTERNS) if (re.test(text)) return role;
  return "Software Engineer";
}

function detectTags(text: string): string[] {
  const tags = new Set<string>();
  for (const [re, tag] of TAG_PATTERNS) if (re.test(text)) tags.add(tag);
  return [...tags].slice(0, 6);
}

function detectOutcome(text: string): "Selected" | "Rejected" | "Pending" {
  if (/\b(got|received|accepted)( an?| the)? offer|got in|selected|cleared|passed\b/i.test(text))
    return "Selected";
  if (/\breject(ed|ion)?|\bding(ed)?\b|did ?n[o']t (get|make)|unsuccessful|failed\b/i.test(text))
    return "Rejected";
  return "Pending";
}

function detectLevel(text: string): string {
  if (/intern(ship)?/i.test(text)) return "Internship";
  if (/\b(staff|principal)\b/i.test(text)) return "Senior";
  if (/\bsenior\b|\bsr\.?\b/i.test(text)) return "Senior";
  if (/new ?grad|entry|junior|\bjr\.?\b|university|college grad/i.test(text))
    return "Entry Level";
  return "Mid Level";
}

function detectInterviewType(text: string): string {
  if (/system design/i.test(text)) return "System Design";
  if (/phone screen|phone interview/i.test(text)) return "Phone Screen";
  if (/take[\s-]?home/i.test(text)) return "Take-home";
  if (/behavioral|behavioural/i.test(text)) return "Behavioral";
  if (/virtual|online|remote/i.test(text)) return "Virtual";
  return "Onsite";
}

function extractQuestions(text: string): string[] {
  const lines = text.split(/\n+/).map((l) => l.trim());
  const questions: string[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*\d.)\s]+/, "").trim();
    if (clean.length > 12 && clean.length < 200 && clean.includes("?")) {
      questions.push(clean.endsWith("?") ? clean : clean.split("?")[0] + "?");
    }
  }
  return [...new Set(questions)].slice(0, 8);
}

function estimateDifficulty(text: string, ups: number): number {
  let d = 5;
  if (/very (hard|difficult)|brutal|insane|grueling/i.test(text)) d = 9;
  else if (/\b(hard|difficult|tough|challenging)\b/i.test(text)) d = 7;
  else if (/\b(easy|simple|straightforward)\b/i.test(text)) d = 3;
  if (/medium/i.test(text)) d = 6;
  return Math.min(10, Math.max(1, d + (ups > 200 ? 1 : 0)));
}

async function fetchSubreddit(sub: string, query: string): Promise<RedditChild[]> {
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(
    query,
  )}&restrict_sr=on&sort=top&t=all&limit=100`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    console.warn(`  ! r/${sub} returned ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json?.data?.children ?? [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await connectDB();
  console.log("Connected. Importing real interview experiences from Reddit...\n");

  let imported = 0;
  let skipped = 0;

  for (const { sub, query } of SOURCES) {
    console.log(`Fetching r/${sub} ("${query}")...`);
    const children = await fetchSubreddit(sub, query);
    console.log(`  found ${children.length} threads`);

    for (const { data } of children) {
      if (data.stickied || data.over_18) continue;
      const text = `${data.title}\n${data.selftext ?? ""}`;

      // Quality gate: must look like an interview post and name a company.
      if (!/interview/i.test(text)) continue;
      const company = detectCompany(text);
      if (!company) continue;
      if ((data.selftext ?? "").length < 120) continue; // skip thin posts

      const sourceId = `reddit_${data.id}`;
      const exists = await Post.exists({ sourceId });
      if (exists) {
        skipped++;
        continue;
      }

      const role = detectRole(text);
      const createdAt = new Date(data.created_utc * 1000);
      const ups = Math.max(0, data.ups ?? 0);
      const questions = extractQuestions(data.selftext ?? "");

      await Post.create({
        title: data.title.slice(0, 160),
        slug: postSlug(company, role),
        company,
        companySlug: slugify(company),
        role,
        roleSlug: slugify(role),
        location: "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experienceLevel: detectLevel(text) as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interviewType: detectInterviewType(text) as any,
        interviewDate: createdAt,
        rounds: Math.min(8, Math.max(1, (data.selftext.match(/round/gi) || []).length || 2)),
        roundBreakdown: [],
        outcome: detectOutcome(text),
        difficulty: estimateDifficulty(text, ups),
        preparationResources: [],
        questions,
        tips: "",
        content: (data.selftext ?? "").slice(0, 8000),
        tags: detectTags(text),
        createdBy: null,
        isAnonymous: false,
        upvotes: ups,
        downvotes: 0,
        score: ups,
        commentCount: data.num_comments ?? 0,
        views: 0,
        source: "reddit",
        sourceUrl: `https://www.reddit.com${data.permalink}`,
        sourceAuthor: data.author,
        sourceId,
        createdAt,
      });
      imported++;
    }

    await sleep(1500); // be polite to Reddit
  }

  console.log(`\nDone. Imported ${imported} new posts, skipped ${skipped} duplicates.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
