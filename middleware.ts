import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

async function getSessionToken(req: NextRequest) {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    // Try both secure (HTTPS/Vercel) and non-secure (localhost) cookie names
    const cookieNames = [
        "__Secure-authjs.session-token",
        "authjs.session-token",
    ];

    for (const cookieName of cookieNames) {
        // Handle single cookie
        let tokenValue = req.cookies.get(cookieName)?.value;

        // If not found, try chunked cookies (next-auth splits large JWTs)
        if (!tokenValue) {
            const chunks: string[] = [];
            let i = 0;
            while (true) {
                const chunk = req.cookies.get(`${cookieName}.${i}`)?.value;
                if (!chunk) break;
                chunks.push(chunk);
                i++;
            }
            if (chunks.length > 0) {
                tokenValue = chunks.join("");
            }
        }

        if (tokenValue) {
            try {
                return await decode({ token: tokenValue, secret, salt: cookieName });
            } catch {
                continue;
            }
        }
    }
    return null;
}

export default async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    const token = await getSessionToken(req);
    const isLoggedIn = !!token;

    // Public routes that don't need auth
    const publicRoutes = ["/login", "/register", "/select-scholarship", "/verify-email", "/forgot-password", "/reset-password"];
    if (publicRoutes.some((r) => pathname.startsWith(r))) {
        if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
            const role = token.role as string;
            return NextResponse.redirect(
                new URL(role === "ADMIN" ? "/admin/dashboard" : "/dashboard", req.url)
            );
        }
        return NextResponse.next();
    }

    // Not logged in → redirect to login
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
    }

    const role = token.role as string;
    const status = token.status as string;
    const scholarshipId = token.scholarshipId as string | null;

    // Admin users should not visit student pages
    if (role === "ADMIN" && !pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Student without scholarship → must select scholarship first
    if (role === "STUDENT" && !scholarshipId && pathname !== "/select-scholarship") {
        return NextResponse.redirect(new URL("/select-scholarship", req.url));
    }

    // Admin routes
    if (pathname.startsWith("/admin")) {
        if (role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    // Student-only feature routes (require APPROVED status)
    const requiresApproval = ["/achievements", "/reports", "/documents"];
    if (requiresApproval.some((r) => pathname.startsWith(r))) {
        if (status !== "APPROVED") {
            return NextResponse.redirect(new URL("/dashboard?pendingApproval=1", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
