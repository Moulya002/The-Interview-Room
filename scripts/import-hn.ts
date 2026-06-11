/**
 * Imports real interview-related discussions from Hacker News via the public
 * Algolia HN Search API (https://hn.algolia.com/api), which is provided free
 * for public reuse. Each imported post links back to the original HN thread
 * and credits the original author(s).
 *
 * Usage:  npm run import:hn
 */
import { loadEnv } from "./load-env";
loadEnv();

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models";
import { postSlug, slugify } from "@/lib/utils";

const COMPANIES = [
  "Google", "Amazon", "Meta", "Facebook", "Microsoft", "Apple", "Netflix",
  "Stripe", "Airbnb", "Uber", "Salesforce", "Oracle", "Adobe", "Nvidia",
  "Tesla", "Bloomberg", "Databricks", "Snowflake", "Atlassian", "Shopify",
  "Coinbase", "DoorDash", "Pinterest", "Snap", "Palantir", "Dropbox",
  "Spotify", "Cloudflare", "Twilio", "IBM", "Intel", "PayPal",
];

const ROLE_PATTERNS: [RegExp, string][] = [
  [/front[\s-]?end/i, "Frontend Engineer"],
  [/back[\s-]?end/i, "Backend Engineer"],
  [/full[\s-]?stack/i, "Full Stack Engineer"],
  [/data engineer/i, "Data Engineer"],
  [/data scientist|data science/i, "Data Scientist"],
  [/(ml|machine learning) engineer/i, "Machine Learning Engineer"],
  [/product manager|\bpm\b/i, "Product Manager"],
  [/devops|sre|site reliability/i, "DevOps Engineer"],
  [/engineering manager|\bem\b/i, "Engineering Manager"],
];

const TAG_PATTERNS: [RegExp, string][] = [
  [/leetcode|\blc\b/i, "leetcode"],
  [/system design/i, "system-design"],
  [/behavioral|behavioural|culture fit/i, "behavioral"],
  [/algorithm|data structure|\bdsa\b/i, "dsa"],
  [/\bsql\b/i, "sql"],
  [/take[\s-]?home/i, "take-home"],
  [/coding/i, "coding"],
  [/whiteboard/i, "whiteboard"],
];

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/&#60;/g, "<")
    .trim();
}

function detectCompany(text: string): string | null {
  for (const c of COMPANIES) {
    const re = new RegExp(`\\b${c}\\b`, "i");
    if (re.test(text)) return c === "Facebook" ? "Meta" : c;
  }
  return null;
}
function detect(patterns: [RegExp, string][], text: string, fallback = ""): string {
  for (const [re, val] of patterns) if (re.test(text)) return val;
  return fallback;
}
function detectTags(text: string): string[] {
  const tags = new Set<string>();
  for (const [re, tag] of TAG_PATTERNS) if (re.test(text)) tags.add(tag);
  tags.add("hacker-news");
  return [...tags].slice(0, 6);
}
function detectOutcome(text: string): "Selected" | "Rejected" | "Pending" {
  if (/got (an )?offer|accepted|got hired|landed/i.test(text)) return "Selected";
  if (/reject(ed|ion)?|did ?n[o']t get|turned down|no offer/i.test(text)) return "Rejected";
  return "Pending";
}
function extractQuestions(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\n+/)) {
    const c = line.replace(/^[-*\d.)\s]+/, "").trim();
    if (c.length > 12 && c.length < 200 && c.includes("?")) out.push(c);
  }
  return [...new Set(out)].slice(0, 6);
}

interface HNHit {
  objectID: string;
  title: string;
  author: string;
  points: number;
  num_comments: number;
  created_at_i: number;
  story_text?: string;
  url?: string;
}
interface HNComment {
  author: string;
  text?: string;
  points?: number;
  children?: HNComment[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function searchStories(query: string): Promise<HNHit[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
    query,
  )}&tags=story&hitsPerPage=20`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.hits ?? [];
}

async function getComments(objectID: string): Promise<HNComment[]> {
  const res = await fetch(`https://hn.algolia.com/api/v1/items/${objectID}`);
  if (!res.ok) return [];
  const json = await res.json();
  const flat: HNComment[] = [];
  const walk = (nodes: HNComment[] = []) => {
    for (const n of nodes) {
      if (n.text) flat.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(json.children ?? []);
  return flat;
}

async function main() {
  await connectDB();
  console.log("Connected. Importing real interview discussions from Hacker News...\n");

  let imported = 0;
  let skipped = 0;

  for (const company of COMPANIES) {
    const hits = await searchStories(`${company} interview`);
    const relevant = hits.filter(
      (h) => /interview/i.test(h.title) && detectCompany(h.title + " " + company),
    );
    if (relevant.length) console.log(`r/${company}: ${relevant.length} relevant threads`);

    for (const hit of relevant.slice(0, 4)) {
      const sourceId = `hn_${hit.objectID}`;
      if (await Post.exists({ sourceId })) {
        skipped++;
        continue;
      }

      const comments = await getComments(hit.objectID);
      const topComments = comments
        .map((c) => ({ ...c, clean: stripHtml(c.text ?? "") }))
        .filter((c) => c.clean.length > 180)
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        .slice(0, 4);

      const storyText = stripHtml(hit.story_text ?? "");
      const body = [
        storyText,
        ...topComments.map((c) => `\n— ${c.author} (HN):\n${c.clean}`),
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 9000);

      // Skip threads with no usable experience content.
      if (body.length < 200) {
        await sleep(300);
        continue;
      }

      const fullText = `${hit.title}\n${body}`;
      const role = detect(ROLE_PATTERNS, fullText, "Software Engineer");
      const createdAt = new Date(hit.created_at_i * 1000);

      await Post.create({
        title: hit.title.slice(0, 160),
        slug: postSlug(company, role),
        company,
        companySlug: slugify(company),
        role,
        roleSlug: slugify(role),
        experienceLevel: /senior|staff|principal/i.test(fullText) ? "Senior" : "Mid Level",
        interviewType: detect(
          [
            [/system design/i, "System Design"],
            [/phone screen/i, "Phone Screen"],
            [/take[\s-]?home/i, "Take-home"],
            [/behavioral/i, "Behavioral"],
          ],
          fullText,
          "Onsite",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any,
        interviewDate: createdAt,
        rounds: Math.min(8, Math.max(1, (body.match(/round/gi) || []).length || 2)),
        outcome: detectOutcome(fullText),
        difficulty: /hard|difficult|brutal|tough/i.test(fullText)
          ? 8
          : /easy|simple/i.test(fullText)
            ? 3
            : 6,
        questions: extractQuestions(body),
        content: body,
        tags: detectTags(fullText),
        createdBy: null,
        isAnonymous: false,
        upvotes: Math.max(0, hit.points ?? 0),
        downvotes: 0,
        score: Math.max(0, hit.points ?? 0),
        commentCount: hit.num_comments ?? 0,
        views: 0,
        source: "hackernews",
        sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        sourceAuthor: hit.author,
        sourceId,
        createdAt,
      });
      imported++;
      await sleep(400);
    }
    await sleep(500);
  }

  console.log(`\nDone. Imported ${imported} new posts, skipped ${skipped} duplicates.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
