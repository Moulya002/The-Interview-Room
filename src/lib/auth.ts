import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
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
