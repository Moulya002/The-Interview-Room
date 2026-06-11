import { loadEnv } from "./load-env";
loadEnv();

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User, Post, Comment } from "@/models";
import { postSlug, slugify, hotScore } from "@/lib/utils";

const companies = ["Google", "Amazon", "Meta", "Microsoft", "Netflix", "Stripe", "Airbnb"];
const roles = [
  "Software Engineer",
  "Data Engineer",
  "Data Scientist",
  "Product Manager",
  "Frontend Engineer",
];
const locations = ["Remote", "San Francisco, CA", "Seattle, WA", "Bangalore, India", "London, UK"];
const levels = ["Entry Level", "Mid Level", "Senior", "Staff"] as const;
const types = ["Onsite", "Virtual", "Phone Screen", "System Design", "Coding"] as const;
const outcomes = ["Selected", "Rejected", "Pending"] as const;
const tagPool = ["dsa", "system-design", "behavioral", "leetcode", "sql", "ml", "react", "distributed-systems", "oop", "graphs"];

const sampleQuestions = [
  "Reverse a linked list in place.",
  "Design a URL shortener.",
  "Find the longest substring without repeating characters.",
  "How would you design a rate limiter?",
  "Explain the CAP theorem.",
  "Tell me about a time you handled conflict on a team.",
  "Implement an LRU cache.",
  "Design a news feed system.",
  "Write SQL to find the second highest salary.",
  "Merge k sorted lists.",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickMany<T>(arr: readonly T[], n: number): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await connectDB();
  console.log("Connected. Seeding...");

  await Promise.all([
    Post.deleteMany({}),
    Comment.deleteMany({}),
    User.deleteMany({ email: /@example\.com$/ }),
  ]);

  const users = await User.insertMany(
    Array.from({ length: 8 }).map((_, i) => ({
      name: `Demo User ${i + 1}`,
      email: `demo${i + 1}@example.com`,
      image: `https://i.pravatar.cc/150?img=${i + 10}`,
      avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
      bio: "Sharing my interview journey to help others.",
      reputation: randInt(0, 500),
      role: i === 0 ? "admin" : "user",
    })),
  );
  console.log(`Created ${users.length} users (demo1@example.com is admin).`);

  const posts = [];
  for (let i = 0; i < 60; i++) {
    const company = pick(companies);
    const role = pick(roles);
    const difficulty = randInt(2, 10);
    const rounds = randInt(2, 6);
    const upvotes = randInt(0, 200);
    const downvotes = randInt(0, 30);
    const createdAt = new Date(Date.now() - randInt(0, 30) * 86400000);
    const questions = pickMany(sampleQuestions, randInt(2, 5));

    posts.push({
      title: `${role} interview experience at ${company}`,
      slug: postSlug(company, role),
      company,
      companySlug: slugify(company),
      role,
      roleSlug: slugify(role),
      location: pick(locations),
      experienceLevel: pick(levels),
      interviewType: pick(types),
      interviewDate: createdAt,
      rounds,
      roundBreakdown: Array.from({ length: Math.min(rounds, 3) }).map((_, r) => ({
        title: `Round ${r + 1}`,
        type: pick(types),
        description: "Discussed technical problems and past experience.",
        questions: pickMany(sampleQuestions, 2),
      })),
      outcome: pick(outcomes),
      difficulty,
      salaryMin: randInt(80, 150) * 1000,
      salaryMax: randInt(150, 250) * 1000,
      salaryCurrency: "USD",
      preparationResources: ["LeetCode", "System Design Primer", "Cracking the Coding Interview"],
      questions,
      tips: "Practice consistently and communicate your thought process clearly.",
      content: "Overall it was a positive experience with thoughtful interviewers.",
      tags: pickMany(tagPool, randInt(2, 4)),
      createdBy: pick(users)._id,
      isAnonymous: Math.random() < 0.2,
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      commentCount: 0,
      views: randInt(10, 2000),
      createdAt,
    });
  }

  const inserted = await Post.insertMany(posts);
  console.log(`Created ${inserted.length} posts.`);

  // A few comments per post.
  const comments = [];
  for (const post of inserted.slice(0, 30)) {
    const n = randInt(0, 4);
    for (let c = 0; c < n; c++) {
      comments.push({
        postId: post._id,
        content: pick([
          "Thanks for sharing, this is really helpful!",
          "How long did the whole process take?",
          "Did they ask any behavioral questions?",
          "Congrats on the offer!",
          "This matches my experience too.",
        ]),
        userId: pick(users)._id,
        upvotes: randInt(0, 20),
        score: randInt(0, 20),
      });
    }
    await Post.updateOne({ _id: post._id }, { $set: { commentCount: n } });
  }
  await Comment.insertMany(comments);
  console.log(`Created ${comments.length} comments.`);

  await mongoose.disconnect();
  console.log("Done. Sign in with the Google/GitHub account using demo1@example.com to get admin (or set ADMIN_EMAILS).");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
