import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

interface ApiAuthResponse {
  access_token: string;
  user: { id: string; name: string; email: string };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;

        const data: ApiAuthResponse = await res.json();

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          accessToken: data.access_token,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days — matches refresh token TTL
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const accessToken = (user as { accessToken: string }).accessToken;
        token.accessToken = accessToken;

        const wsRes = await fetch(`${API_URL}/workspaces/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => null);

        if (wsRes?.ok) {
          const workspaces = await wsRes.json();
          token.workspaceId = workspaces[0]?.id ?? null;
        } else {
          token.workspaceId = null;
        }
      }

      if (trigger === "update") {
        if (session?.workspaceId !== undefined) {
          token.workspaceId = session.workspaceId;
        }
        if (session?.accessToken !== undefined) {
          token.accessToken = session.accessToken;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.workspaceId = token.workspaceId as string | null;
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
});
