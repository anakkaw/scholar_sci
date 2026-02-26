import "next-auth";
import "next-auth/jwt";
import type { Role, UserStatus } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            role: Role;
            status: UserStatus;
            scholarshipId: string | null;
        };
    }
    interface User {
        role?: Role;
        status?: UserStatus;
        scholarshipId?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: Role;
        status: UserStatus;
        scholarshipId: string | null;
    }
}

// ── App types ─────────────────────────────────────────────────────────────────

export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};

export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type AchievementTypeLabel = {
    value: string;
    label: string;
    color: string;
};

export const ACHIEVEMENT_TYPES: AchievementTypeLabel[] = [
    { value: "ACTIVITY",    label: "การเข้าร่วมกิจกรรม",      color: "amber"  },
    { value: "PUBLICATION", label: "บทความวิชาการ/วิจัย",      color: "blue"   },
    { value: "COMPETITION", label: "การแข่งขัน",               color: "orange" },
    { value: "PATENT",      label: "สิทธิบัตร/อนุสิทธิบัตร",  color: "purple" },
    { value: "PROJECT",     label: "โครงการ/งานวิจัย",         color: "green"  },
    { value: "AWARD",       label: "รางวัล/เกียรติบัตร",       color: "yellow" },
    { value: "OTHER",       label: "อื่นๆ",                    color: "gray"   },
];

export const ACADEMIC_RECORD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING:  { label: "รอตรวจสอบ",    color: "yellow" },
    VERIFIED: { label: "ตรวจสอบแล้ว",  color: "green"  },
    REJECTED: { label: "ไม่ผ่าน",      color: "red"    },
};

export const REPORT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "ฉบับร่าง", color: "gray" },
    SUBMITTED: { label: "ส่งแล้ว", color: "blue" },
    REVIEWED: { label: "ตรวจสอบแล้ว", color: "green" },
    NEED_REVISION: { label: "ต้องแก้ไข", color: "red" },
};

export const USER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: "รอการอนุมัติ", color: "yellow" },
    APPROVED: { label: "อนุมัติแล้ว", color: "green" },
    REJECTED: { label: "ปฏิเสธ", color: "red" },
    SUSPENDED: { label: "ถูกระงับ", color: "orange" },
};

export const DOCUMENT_CATEGORIES = ["คู่มือ", "แบบฟอร์ม", "ประกาศ", "ระเบียบ", "อื่นๆ"];

// ── Shared display labels ────────────────────────────────────────────────────

export const SEMESTER_LABELS: Record<string, string> = {
    "1": "ภาคเรียนที่ 1",
    "2": "ภาคเรียนที่ 2",
    "3": "ภาคฤดูร้อน",
};

export const YEAR_LABELS: Record<number, string> = {
    1: "ปี 1", 2: "ปี 2", 3: "ปี 3", 4: "ปี 4", 5: "ปี 5", 6: "ปี 6",
};

export const STATUS_ACCENT: Record<string, string> = {
    VERIFIED: "from-green-400 to-emerald-500",
    PENDING:  "from-amber-400 to-amber-500",
    REJECTED: "from-red-400 to-red-500",
};
