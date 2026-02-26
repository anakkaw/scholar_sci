import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { isRateLimited, incrementCounter, resetLimit } from "./rate-limit";

class EmailNotVerifiedError extends CredentialsSignin {
    code = "email_not_verified";
}

// แจ้ง error เมื่อถูก lock จาก brute-force protection
class TooManyAttemptsError extends CredentialsSignin {
    code = "too_many_attempts";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const emailKey = `login-fail:${(credentials.email as string).toLowerCase()}`;

                // Brute-force protection: ล็อก 15 นาที หลังพยายามผิด 5 ครั้ง
                const { limited, retryAfterSec } = isRateLimited(emailKey, 5);
                if (limited) {
                    const waitMin = Math.ceil(retryAfterSec / 60);
                    // ใช้ custom error เพื่อแสดง message ที่หน้า login
                    const err = new TooManyAttemptsError();
                    err.message = `พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${waitMin} นาทีแล้วลองใหม่`;
                    throw err;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                    include: { studentProfile: true },
                });

                if (!user || !user.passwordHash) {
                    // นับ failed attempt แม้ email ไม่มีในระบบ (ป้องกัน user enumeration timing)
                    incrementCounter(emailKey, 15 * 60_000);
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    // นับ failed attempt
                    incrementCounter(emailKey, 15 * 60_000);
                    return null;
                }

                if (!user.emailVerified) {
                    throw new EmailNotVerifiedError();
                }

                // Login สำเร็จ — รีเซ็ต failed attempt counter
                resetLimit(emailKey);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.studentProfile?.fullName,
                    image: user.image,
                    role: user.role,
                    status: user.status,
                    scholarshipId: user.studentProfile?.scholarshipId,
                };
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            // Call the base config's JWT function first
            if (authConfig.callbacks?.jwt) {
                token = await authConfig.callbacks.jwt({ token, user, trigger, session });
            }

            // Sync database status periodically (every 60 seconds) to pick up admin changes
            const now = Math.floor(Date.now() / 1000);
            const lastSync = (token.dbSyncedAt as number) || 0;
            if (token.id && now - lastSync > 60) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { status: true, role: true, studentProfile: { select: { scholarshipId: true } } }
                });
                if (dbUser) {
                    token.status = dbUser.status;
                    token.role = dbUser.role;
                    token.scholarshipId = dbUser.studentProfile?.scholarshipId || null;
                    token.dbSyncedAt = now;
                }
            }

            return token;
        },
    }
});
