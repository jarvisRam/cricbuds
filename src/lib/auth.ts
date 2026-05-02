import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);
      if (!existing) return false;

      if (!existing.name && user.name) {
        await db
          .update(users)
          .set({ name: user.name, image: user.image })
          .where(eq(users.email, user.email));
      }
      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const db = getDb();
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, token.email))
        .limit(1);
      if (dbUser) {
        token.userId = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
