import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Read JWT token directly (Edge-compatible via jose)
    const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
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
