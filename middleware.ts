import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session;
    const pathname = nextUrl.pathname;

    // Public routes that don't need auth
    const publicRoutes = ["/login", "/register", "/select-scholarship", "/verify-email", "/forgot-password", "/reset-password"];
    if (publicRoutes.some((r) => pathname.startsWith(r))) {
        if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
            const role = session.user.role;
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

    const role = session.user.role;
    const status = session.user.status;
    const scholarshipId = session.user.scholarshipId;

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
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
