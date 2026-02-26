import { getSession } from "@/lib/session";
import { revalidatePath, revalidateTag } from "next/cache";

type ActionResult<T = string> = { success?: T; error?: string };

// ── Auth guards ──────────────────────────────────────────────────────────────

export async function requireAdmin() {
    const session = await getSession();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        throw new AuthError("ไม่มีสิทธิ์ในการดำเนินการ");
    }
    return session;
}

export async function requireUser() {
    const session = await getSession();
    if (!session?.user?.id) {
        throw new AuthError("กรุณาเข้าสู่ระบบ");
    }
    return session;
}

class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

// ── Safe action wrapper ──────────────────────────────────────────────────────

export async function safeAction<T = string>(
    fn: () => Promise<ActionResult<T>>,
    fallbackError = "เกิดข้อผิดพลาด"
): Promise<ActionResult<T>> {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: error.message };
        }
        console.error(fallbackError, error);
        return { error: fallbackError };
    }
}

// ── Revalidation helpers ─────────────────────────────────────────────────────

export function revalidateDocuments() {
    revalidateTag("documents");
    revalidatePath("/admin/documents");
    revalidatePath("/documents");
}

export function revalidateScholarships() {
    revalidateTag("scholarships");
    revalidatePath("/admin/scholarships");
}

export function revalidateStudentData(...extraPaths: string[]) {
    revalidatePath("/dashboard");
    for (const p of extraPaths) revalidatePath(p);
}

export function revalidateAdminDashboard(...extraPaths: string[]) {
    revalidatePath("/admin/dashboard");
    for (const p of extraPaths) revalidatePath(p);
}
