import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "-";
    const d = new Date(date);
    return `${format(d, "d MMMM", { locale: th })} ${d.getFullYear() + 543}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "-";
    const d = new Date(date);
    return `${format(d, "d MMMM", { locale: th })} ${d.getFullYear() + 543} ${format(d, "HH:mm")} น.`;
}

export function formatShortDate(date: Date | string | null | undefined): string {
    if (!date) return "-";
    const d = new Date(date);
    const yearShort = String(d.getFullYear() + 543).slice(-2);
    return `${format(d, "d MMM", { locale: th })} ${yearShort}`;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Academic context ─────────────────────────────────────────────────────────

export const SEMESTERS = [
    { label: "ภาคเรียนที่ 1", value: "1" },
    { label: "ภาคเรียนที่ 2", value: "2" },
    { label: "ภาคฤดูร้อน", value: "3" },
];

/** Shared helper — returns current BE academic year and month. */
function getAcademicContext() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const yearBE = now.getFullYear() + 543;
    const currentAcademicYear = month >= 6 ? yearBE : yearBE - 1;
    return { month, yearBE, currentAcademicYear };
}

/**
 * Returns academic years from enrollmentYear up to currentAcademicYear.
 * Falls back to last 5 years if enrollmentYear is null/invalid.
 */
export function getAcademicYears(enrollmentYear?: number | null): string[] {
    const { currentAcademicYear } = getAcademicContext();
    const hasValidEnrollment = enrollmentYear && enrollmentYear <= currentAcademicYear;
    const count = hasValidEnrollment
        ? currentAcademicYear - enrollmentYear + 1
        : 5;
    return Array.from({ length: count }, (_, i) => String(currentAcademicYear - i));
}

/** Extracts enrollment year (BE) from student ID code (first 2 digits). */
export function getEnrollmentYear(studentIdCode: string | null | undefined): number | null {
    if (!studentIdCode || studentIdCode.length < 2) return null;
    const short = parseInt(studentIdCode.substring(0, 2), 10);
    return isNaN(short) ? null : 2500 + short;
}

export function getCurrentAcademicYear(): string {
    return String(getAcademicContext().currentAcademicYear);
}

export function getCurrentSemester(): string {
    const { month } = getAcademicContext();
    if (month >= 6 && month <= 10) return "1";
    if (month >= 11 || month <= 3) return "2";
    return "3";
}

/**
 * Compute academic year level from student ID code.
 * The first 2 digits = Buddhist Era entry year (e.g. "68" -> 2568 BE).
 */
export function computeYearLevel(studentIdCode: string): number | null {
    if (!studentIdCode || studentIdCode.length < 2) return null;
    const entryYearShort = parseInt(studentIdCode.substring(0, 2), 10);
    if (isNaN(entryYearShort)) return null;
    const entryYearBE = 2500 + entryYearShort;
    const { currentAcademicYear } = getAcademicContext();
    const yearLevel = currentAcademicYear - entryYearBE + 1;
    return yearLevel >= 1 && yearLevel <= 8 ? yearLevel : null;
}
