import { NextAuthConfig } from "next-auth";

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    providers: [], // Provided in auth.ts
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id as string;
                token.role = user.role as "STUDENT" | "ADMIN";
                token.status = user.status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
                token.scholarshipId = user.scholarshipId as string | null;
            }

            // Allow manual updates (e.g., when profile changes)
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "STUDENT" | "ADMIN";
                session.user.status = token.status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
                session.user.scholarshipId = (token.scholarshipId as string) || null;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
