import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// Restrict access to specific GitHub usernames
const ALLOWED_USERS = (process.env.ALLOWED_GITHUB_USERS || "")
  .split(",")
  .map((u) => u.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const username = (profile as { login?: string })?.login?.toLowerCase() || "";
      if (ALLOWED_USERS.length === 0) return true; // no restriction if not configured
      return ALLOWED_USERS.includes(username);
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { username?: string }).username = token.username as string;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.username = (profile as { login?: string }).login;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};
