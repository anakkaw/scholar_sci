import { NextResponse } from "next/server";

export async function GET() {
    const checks: Record<string, unknown> = {};

    // 1. Check environment variables
    checks.env = {
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length ?? 0,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "(not set)",
        DATABASE_URL: !!process.env.DATABASE_URL,
        DATABASE_URL_PREVIEW: process.env.DATABASE_URL?.substring(0, 30) + "...",
        NODE_ENV: process.env.NODE_ENV,
    };

    // 2. Test Prisma
    try {
        const { prisma } = await import("@/lib/prisma");
        const count = await prisma.user.count();
        checks.prisma = { ok: true, userCount: count };
    } catch (e: unknown) {
        checks.prisma = { ok: false, error: (e as Error).message, stack: (e as Error).stack?.substring(0, 500) };
    }

    // 3. Test bcryptjs
    try {
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.hash("test", 10);
        const match = await bcrypt.compare("test", hash);
        checks.bcrypt = { ok: true, match };
    } catch (e: unknown) {
        checks.bcrypt = { ok: false, error: (e as Error).message };
    }

    // 4. Test rate-limit module
    try {
        const rl = await import("@/lib/rate-limit");
        checks.rateLimit = { ok: true, hasIsRateLimited: typeof rl.isRateLimited === "function" };
    } catch (e: unknown) {
        checks.rateLimit = { ok: false, error: (e as Error).message };
    }

    // 5. Test auth.config.ts (Edge-safe config)
    try {
        const { authConfig } = await import("@/lib/auth.config");
        checks.authConfig = { ok: true, hasCallbacks: !!authConfig.callbacks, trustHost: authConfig.trustHost };
    } catch (e: unknown) {
        checks.authConfig = { ok: false, error: (e as Error).message, stack: (e as Error).stack?.substring(0, 500) };
    }

    // 6. Test PrismaAdapter creation
    try {
        const { PrismaAdapter } = await import("@auth/prisma-adapter");
        const { prisma } = await import("@/lib/prisma");
        const adapter = PrismaAdapter(prisma);
        checks.prismaAdapter = { ok: true, methods: Object.keys(adapter) };
    } catch (e: unknown) {
        checks.prismaAdapter = { ok: false, error: (e as Error).message, stack: (e as Error).stack?.substring(0, 500) };
    }

    // 7. Test NextAuth initialization (THE CRITICAL TEST)
    try {
        const { auth, handlers } = await import("@/lib/auth");
        checks.nextAuth = { ok: true, hasAuth: typeof auth === "function", hasHandlers: !!handlers };
    } catch (e: unknown) {
        checks.nextAuth = {
            ok: false,
            error: (e as Error).message,
            stack: (e as Error).stack?.substring(0, 1000),
            name: (e as Error).name,
        };
    }

    return NextResponse.json(checks, { status: 200 });
}
