"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserStatus, AuditAction, VerificationStatus, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { ProfileSchema } from "@/lib/validations";
import { computeYearLevel } from "@/lib/utils";
import { requireAdmin, safeAction, revalidateAdminDashboard } from "@/lib/action-helpers";

export const updateUserStatusAction = async (userId: string, status: UserStatus, reason?: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const auditAction: AuditAction = ({
            APPROVED: "USER_APPROVED",
            REJECTED: "USER_REJECTED",
            SUSPENDED: "USER_SUSPENDED",
            PENDING: "USER_REINSTATED",
        } as const)[status] ?? "USER_APPROVED";

        // Single transaction: update + audit log in one DB roundtrip.
        // The where-clause { role: "STUDENT" } guards against invalid targets;
        // Prisma throws RecordNotFound (caught by safeAction) if user doesn't exist.
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId, role: "STUDENT" },
                data: { status },
                select: { id: true }, // minimal return
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: auditAction,
                    targetUserId: userId,
                    detailJson: reason ? { reason } : {},
                },
            }),
        ]);

        revalidatePath("/admin/users");
        revalidateAdminDashboard();
        return { success: `เปลี่ยนสถานะเป็น ${status} เรียบร้อยแล้ว` };
    }, "เกิดข้อผิดพลาดในการอัปเดตสถานะ");

export const reviewAcademicRecordAction = async (recordId: string, status: VerificationStatus, note?: string) =>
    safeAction(async () => {
        const session = await requireAdmin();
        const record = await prisma.academicRecord.findUnique({ where: { id: recordId } });
        if (!record) return { error: "ไม่พบข้อมูลผลการเรียน" };

        const auditAction: AuditAction = status === "VERIFIED" ? "ACADEMIC_RECORD_VERIFIED" : "ACADEMIC_RECORD_REJECTED";

        await prisma.$transaction([
            prisma.academicRecord.update({
                where: { id: recordId },
                data: { status, reviewNote: note || null, reviewerAdminId: session.user.id },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: auditAction,
                    targetUserId: record.userId,
                    detailJson: { academicYear: record.academicYear, semester: record.semester, gpa: record.gpa, note },
                },
            }),
        ]);

        revalidateAdminDashboard();
        return { success: status === "VERIFIED" ? "ยืนยันผลการเรียนเรียบร้อย" : "ปฏิเสธผลการเรียนเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการตรวจสอบผลการเรียน");

export const createAdminAction = async (email: string, password: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        if (!email || !password || password.length < 6) {
            return { error: "ข้อมูลไม่ถูกต้อง กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร" };
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return { error: "อีเมลนี้มีอยู่ในระบบแล้ว" };

        const passwordHash = await bcrypt.hash(password, 10);
        const newAdmin = await prisma.user.create({
            data: { email, passwordHash, role: "ADMIN", status: "APPROVED", emailVerified: new Date() },
        });

        await prisma.auditLog.create({
            data: { actorAdminId: session.user.id, action: "ADMIN_CREATED", targetUserId: newAdmin.id, detailJson: { email } },
        });

        revalidatePath("/admin/settings");
        return { success: `สร้างบัญชี Admin สำหรับ ${email} เรียบร้อยแล้ว` };
    }, "เกิดข้อผิดพลาดในการสร้างบัญชี Admin");

export const reviewAchievementAction = async (achievementId: string, status: VerificationStatus, note?: string) =>
    safeAction(async () => {
        const session = await requireAdmin();
        const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
        if (!achievement) return { error: "ไม่พบข้อมูลผลงาน" };

        const auditAction: AuditAction = status === "VERIFIED" ? "ACHIEVEMENT_VERIFIED" : "ACHIEVEMENT_REJECTED";

        await prisma.$transaction([
            prisma.achievement.update({
                where: { id: achievementId },
                data: { verificationStatus: status, verificationNote: note || null },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: auditAction,
                    targetUserId: achievement.userId,
                    detailJson: { title: achievement.title, note },
                },
            }),
        ]);

        revalidatePath(`/admin/users/${achievement.userId}`);
        revalidateAdminDashboard();
        return { success: status === "VERIFIED" ? "ยืนยันผลงานเรียบร้อย" : "ปฏิเสธผลงานเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการตรวจสอบผลงาน");

export const adminUpdateAcademicRecordAction = async (recordId: string, gpa: number, gpax: number | null, note?: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        if (gpa < 0 || gpa > 4) return { error: "GPA ต้องอยู่ระหว่าง 0.00 - 4.00" };
        if (gpax !== null && (gpax < 0 || gpax > 4)) return { error: "GPAX ต้องอยู่ระหว่าง 0.00 - 4.00" };

        const record = await prisma.academicRecord.findUnique({ where: { id: recordId } });
        if (!record) return { error: "ไม่พบข้อมูลผลการเรียน" };

        await prisma.$transaction([
            prisma.academicRecord.update({
                where: { id: recordId },
                data: { gpa, gpax: gpax ?? null, status: "VERIFIED", reviewNote: note || null, reviewerAdminId: session.user.id },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: "ACADEMIC_RECORD_VERIFIED",
                    targetUserId: record.userId,
                    detailJson: { academicYear: record.academicYear, semester: record.semester, oldGpa: record.gpa, newGpa: gpa, gpax, note },
                },
            }),
        ]);

        revalidatePath(`/admin/users/${record.userId}`);
        revalidateAdminDashboard();
        return { success: "แก้ไข GPA / GPAX และยืนยันผลการเรียนเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการแก้ไขผลการเรียน");

// ── MANDATORY ACTIVITIES ─────────────────────────────────────────────────────

export const createMandatoryActivityAction = async (data: {
    title: string;
    description?: string;
    scholarshipId?: string;
    degreeLevel?: string;
    yearLevel?: number;
}) =>
    safeAction(async () => {
        const session = await requireAdmin();
        if (!data.title?.trim()) return { error: "กรุณาระบุชื่อกิจกรรม" };

        const profileWhere: Record<string, unknown> = {};
        if (data.scholarshipId) profileWhere.scholarshipId = data.scholarshipId;
        if (data.degreeLevel) profileWhere.degreeLevel = data.degreeLevel;
        if (data.yearLevel) profileWhere.yearLevel = data.yearLevel;

        const matchingStudents = await prisma.user.findMany({
            where: {
                role: "STUDENT",
                status: "APPROVED",
                ...(Object.keys(profileWhere).length > 0 ? { studentProfile: { is: profileWhere } } : {}),
            },
            select: { id: true },
        });

        const activity = await prisma.mandatoryActivity.create({
            data: {
                title: data.title.trim(),
                description: data.description?.trim() || null,
                scholarshipId: data.scholarshipId || null,
                degreeLevel: data.degreeLevel || null,
                yearLevel: data.yearLevel || null,
            },
        });

        if (matchingStudents.length > 0) {
            await prisma.mandatoryActivityParticipation.createMany({
                data: matchingStudents.map(s => ({ activityId: activity.id, userId: s.id })),
            });
        }

        await prisma.auditLog.create({
            data: {
                actorAdminId: session.user.id,
                action: "MANDATORY_ACTIVITY_CREATED",
                detailJson: { title: data.title, assignedCount: matchingStudents.length },
            },
        });

        revalidatePath("/admin/activities");
        return { success: `สร้างกิจกรรมและกำหนดให้นิสิต ${matchingStudents.length} คน` };
    }, "เกิดข้อผิดพลาดในการสร้างกิจกรรม");

export const deleteMandatoryActivityAction = async (activityId: string) =>
    safeAction(async () => {
        const session = await requireAdmin();
        const activity = await prisma.mandatoryActivity.findUnique({ where: { id: activityId } });
        if (!activity) return { error: "ไม่พบกิจกรรม" };

        await prisma.mandatoryActivity.delete({ where: { id: activityId } });
        await prisma.auditLog.create({
            data: { actorAdminId: session.user.id, action: "MANDATORY_ACTIVITY_DELETED", detailJson: { title: activity.title } },
        });

        revalidatePath("/admin/activities");
        return { success: "ลบกิจกรรมเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาดในการลบกิจกรรม");

export const updateAttendanceAction = async (participationId: string, attended: boolean, userId: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        await prisma.mandatoryActivityParticipation.update({ where: { id: participationId }, data: { attended } });
        await prisma.auditLog.create({
            data: {
                actorAdminId: session.user.id,
                action: "ATTENDANCE_UPDATED",
                targetUserId: userId,
                detailJson: { participationId, attended },
            },
        });

        revalidatePath(`/admin/users/${userId}`);
        revalidatePath("/admin/activities");
        return { success: attended ? "บันทึกเข้าร่วมแล้ว" : "คืนสถานะยังไม่ได้เข้าร่วม" };
    }, "เกิดข้อผิดพลาดในการอัปเดตสถานะ");

export const adminUpdateStudentProfileAction = async (userId: string, values: z.infer<typeof ProfileSchema>) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const validatedFields = ProfileSchema.safeParse(values);
        if (!validatedFields.success) return { error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" };

        const profile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!profile) return { error: "ไม่พบข้อมูลนิสิต" };

        const { fullName, nickname, studentIdCode, major, phone, backupEmail, address } = validatedFields.data;
        const yearLevel = studentIdCode ? computeYearLevel(studentIdCode) : null;

        await prisma.$transaction([
            prisma.studentProfile.update({
                where: { userId },
                data: {
                    fullName,
                    nickname: nickname || null,
                    studentIdCode: studentIdCode || null,
                    major: major === "" ? null : major || null,
                    yearLevel,
                    phone: phone || null,
                    backupEmail: backupEmail === "" ? null : backupEmail,
                    address: address || null,
                },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: "STUDENT_PROFILE_UPDATED",
                    targetUserId: userId,
                    detailJson: { fullName, studentIdCode, major },
                },
            }),
        ]);

        revalidatePath(`/admin/users/${userId}`);
        return { success: "อัปเดตข้อมูลนิสิตเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาดในการแก้ไขข้อมูลนิสิต");

// ── PROGRESS REPORT REVIEW ───────────────────────────────────────────────────

export const reviewReportAction = async (
    reportId: string,
    status: "REVIEWED" | "NEED_REVISION",
    note?: string
) =>
    safeAction(async () => {
        const session = await requireAdmin();
        const report = await prisma.progressReport.findUnique({ where: { id: reportId } });
        if (!report) return { error: "ไม่พบข้อมูลรายงาน" };

        await prisma.$transaction([
            prisma.progressReport.update({
                where: { id: reportId },
                data: {
                    status: status as ReportStatus,
                    reviewNote: note || null,
                    reviewerAdminId: session.user.id,
                    reviewedAt: new Date(),
                },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: "REPORT_REVIEWED",
                    targetUserId: report.userId,
                    detailJson: { reportId, status, note },
                },
            }),
        ]);

        revalidatePath(`/admin/users/${report.userId}`);
        revalidateAdminDashboard();
        return { success: status === "REVIEWED" ? "ตรวจสอบรายงานเรียบร้อย" : "ส่งกลับให้แก้ไขเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการตรวจสอบรายงาน");
