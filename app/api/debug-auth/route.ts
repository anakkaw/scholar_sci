import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const checks: Record<string, unknown> = {};

    // 1. Check environment variables
    checks.env = {
        AUTH_SECRET: !!process.env.AUTH_SECRET,
        AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length ?? 0,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "(not set)",
        AUTH_URL: process.env.AUTH_URL ?? "(not set)",
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "(not set)",
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
    };

    // 2. Test Prisma
    try {
        const { prisma } = await import("@/lib/prisma");
        const count = await prisma.user.count();
        checks.prisma = { ok: true, userCount: count };
    } catch (e: unknown) {
        checks.prisma = { ok: false, error: (e as Error).message };
    }

    // 3. Test NextAuth module import
    try {
        const { auth, handlers } = await import("@/lib/auth");
        checks.nextAuthImport = { ok: true, hasAuth: typeof auth === "function", hasHandlers: !!handlers };
    } catch (e: unknown) {
        checks.nextAuthImport = { ok: false, error: (e as Error).message, stack: (e as Error).stack?.substring(0, 1000) };
    }

    // 4. Test calling the actual GET handler (like /api/auth/providers)
    try {
        const { handlers } = await import("@/lib/auth");

        // Create a fake request to /api/auth/providers
        const baseUrl = request.nextUrl.origin;
        const fakeReq = new NextRequest(new URL("/api/auth/providers", baseUrl), {
            method: "GET",
            headers: request.headers,
        });

        const response = await handlers.GET(fakeReq);
        const body = await response.text();
        checks.handlerTest = {
            ok: response.ok,
            status: response.status,
            bodyLength: body.length,
            bodyPreview: body.substring(0, 500),
            headers: Object.fromEntries(response.headers.entries()),
        };
    } catch (e: unknown) {
        checks.handlerTest = {
            ok: false,
            error: (e as Error).message,
            stack: (e as Error).stack?.substring(0, 1500),
            name: (e as Error).name,
        };
    }

    // 5. Test calling the CSRF endpoint
    try {
        const { handlers } = await import("@/lib/auth");

        const baseUrl = request.nextUrl.origin;
        const fakeReq = new NextRequest(new URL("/api/auth/csrf", baseUrl), {
            method: "GET",
            headers: request.headers,
        });

        const response = await handlers.GET(fakeReq);
        const body = await response.text();
        checks.csrfTest = {
            ok: response.ok,
            status: response.status,
            bodyLength: body.length,
            bodyPreview: body.substring(0, 500),
        };
    } catch (e: unknown) {
        checks.csrfTest = {
            ok: false,
            error: (e as Error).message,
            stack: (e as Error).stack?.substring(0, 1500),
            name: (e as Error).name,
        };
    }

    return NextResponse.json(checks, { status: 200 });
}
