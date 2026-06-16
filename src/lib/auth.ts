import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    /**
     * Lightweight email + name registration/login (no password). Creates the
     * account on first use and signs the user in immediately. Frictionless for
     * an MVP; add a password or OTP here later for real account security.
     */
    CredentialsProvider({
      name: "Email",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const name = credentials?.name?.trim();
        if (!email || !EMAIL_RE.test(email)) return null;

        await connectDB();
        const isAdmin = adminEmails.includes(email);
        const set: Record<string, unknown> = {};
        if (name) set.name = name;
        if (isAdmin) set.role = "admin";
        const setOnInsert: Record<string, unknown> = {
          email,
          avatar: "",
          bio: "",
          reputation: 0,
        };
        // Only seed `name` on insert when one wasn't provided, so it never
        // collides with the `$set` above (Mongo forbids the same path in both).
        if (!name) setOnInsert.name = email.split("@")[0];

        const user = await User.findOneAndUpdate(
          { email },
          { $set: set, $setOnInsert: setOnInsert },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        if (!user || user.isBanned) return null;
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          image: user.avatar || user.image || "",
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Upsert the user into our Mongoose collection on every sign-in so that the
     * `User` document (with reputation, role, bio, etc.) stays the source of
     * truth instead of a separate adapter-managed collection.
     */
    async signIn({ user }) {
      if (!user.email) return false;
      await connectDB();
      const email = user.email.toLowerCase();
      const isAdmin = adminEmails.includes(email);
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            name: user.name ?? email.split("@")[0],
            image: user.image ?? "",
            ...(isAdmin ? { role: "admin" } : {}),
          },
          $setOnInsert: {
            email,
            avatar: user.image ?? "",
            bio: "",
            reputation: 0,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      await connectDB();
      const dbUser = await User.findOne({
        email: token.email.toLowerCase(),
      }).lean();
      if (dbUser) {
        token.id = String(dbUser._id);
        token.role = dbUser.role;
        token.reputation = dbUser.reputation;
        token.picture = dbUser.avatar || dbUser.image || token.picture;
        token.name = dbUser.name;
        token.isBanned = dbUser.isBanned;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "user";
        session.user.reputation = (token.reputation as number) ?? 0;
        session.user.isBanned = Boolean(token.isBanned);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
