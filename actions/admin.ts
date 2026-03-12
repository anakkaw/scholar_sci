"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserStatus, AuditAction, VerificationStatus, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { ProfileSchema, DEGREE_LEVEL_OPTIONS } from "@/lib/validations";
import { computeYearLevel } from "@/lib/utils";
import { requireAdmin, safeAction, revalidateAdminDashboard } from "@/lib/action-helpers";
import { assignMandatoryActivitiesToStudent } from "@/lib/assign-mandatory-activities";

export const updateUserStatusAction = async (userId: string, status: UserStatus, reason?: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const auditAction: AuditAction = ({
            APPROVED: "USER_APPROVED",
            REJECTED: "USER_REJECTED",
            SUSPENDED: "USER_SUSPENDED",
            PENDING: "USER_REINSTATED",
        } as const)[status] ?? "USER_APPROVED";

        // When approving, also auto-verify email if not yet verified — so the
        // student can log in immediately without waiting for the email link.
        const user = await prisma.user.findUnique({
            where: { id: userId, role: "STUDENT" },
            select: { id: true, emailVerified: true },
        });
        if (!user) return { error: "ไม่พบข้อมูลนิสิต" };

        const shouldAutoVerifyEmail = status === "APPROVED" && !user.emailVerified;

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    status,
                    ...(shouldAutoVerifyEmail && { emailVerified: new Date() }),
                },
                select: { id: true },
            }),
            ...(shouldAutoVerifyEmail
                ? [prisma.emailVerificationToken.deleteMany({ where: { userId } })]
                : []),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: auditAction,
                    targetUserId: userId,
                    detailJson: reason ? { reason } : {},
                },
            }),
        ]);

        // When approving, auto-assign matching mandatory activities
        if (status === "APPROVED") {
            const profile = await prisma.studentProfile.findUnique({
                where: { userId },
                select: { scholarshipId: true, degreeLevel: true, yearLevel: true },
            });
            if (profile) {
                await assignMandatoryActivitiesToStudent(userId, profile);
            }
        }

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
    requirements?: string[];
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

        const reqs = (data.requirements ?? []).map(r => r.trim()).filter(Boolean);

        const activity = await prisma.mandatoryActivity.create({
            data: {
                title: data.title.trim(),
                description: data.description?.trim() || null,
                scholarshipId: data.scholarshipId || null,
                degreeLevel: data.degreeLevel || null,
                yearLevel: data.yearLevel || null,
                ...(reqs.length > 0 ? {
                    requirements: {
                        create: reqs.map((title, i) => ({ title, orderIndex: i })),
                    },
                } : {}),
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
                detailJson: { title: data.title, assignedCount: matchingStudents.length, requirementsCount: reqs.length },
            },
        });

        revalidatePath("/admin/activities");
        return { success: `สร้างกิจกรรมและกำหนดให้นิสิต ${matchingStudents.length} คน` };
    }, "เกิดข้อผิดพลาดในการสร้างกิจกรรม");

export const updateMandatoryActivityAction = async (
    activityId: string,
    data: { title: string; description?: string; scholarshipId?: string; degreeLevel?: string; yearLevel?: number; requirements?: string[] },
) =>
    safeAction(async () => {
        const session = await requireAdmin();
        if (!data.title?.trim()) return { error: "กรุณาระบุชื่อกิจกรรม" };

        const existing = await prisma.mandatoryActivity.findUnique({ where: { id: activityId } });
        if (!existing) return { error: "ไม่พบกิจกรรม" };

        const reqs = (data.requirements ?? []).map(r => r.trim()).filter(Boolean);

        await prisma.$transaction([
            prisma.mandatoryActivity.update({
                where: { id: activityId },
                data: {
                    title: data.title.trim(),
                    description: data.description?.trim() || null,
                    scholarshipId: data.scholarshipId || null,
                    degreeLevel: data.degreeLevel || null,
                    yearLevel: data.yearLevel || null,
                },
            }),
            prisma.activityRequirement.deleteMany({ where: { activityId } }),
            ...(reqs.length > 0 ? [
                prisma.activityRequirement.createMany({
                    data: reqs.map((title, i) => ({ activityId, title, orderIndex: i })),
                }),
            ] : []),
        ]);

        // Re-assign: find students matching NEW criteria, add missing participations
        const filtersChanged =
            existing.scholarshipId !== (data.scholarshipId || null) ||
            existing.degreeLevel !== (data.degreeLevel || null) ||
            existing.yearLevel !== (data.yearLevel || null);

        let newAssigned = 0;
        if (filtersChanged) {
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

            if (matchingStudents.length > 0) {
                const result = await prisma.mandatoryActivityParticipation.createMany({
                    data: matchingStudents.map(s => ({ activityId, userId: s.id })),
                    skipDuplicates: true,
                });
                newAssigned = result.count;
            }
        }

        await prisma.auditLog.create({
            data: {
                actorAdminId: session.user.id,
                action: "MANDATORY_ACTIVITY_UPDATED",
                detailJson: { title: data.title, filtersChanged, newAssigned },
            },
        });

        revalidatePath("/admin/activities");
        revalidatePath(`/admin/activities/${activityId}`);
        return { success: filtersChanged && newAssigned > 0
            ? `อัปเดตกิจกรรมและเพิ่มนิสิตใหม่ ${newAssigned} คน`
            : "อัปเดตกิจกรรมเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม");

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

        const { fullName, nickname, studentIdCode, major, degreeLevel, phone, backupEmail, address } = validatedFields.data;
        const yearLevel = studentIdCode ? computeYearLevel(studentIdCode) : null;
        const resolvedDegreeLevel = degreeLevel === "" ? null : degreeLevel || null;

        await prisma.$transaction([
            prisma.studentProfile.update({
                where: { userId },
                data: {
                    fullName,
                    nickname: nickname || null,
                    studentIdCode: studentIdCode || null,
                    major: major === "" ? null : major || null,
                    degreeLevel: resolvedDegreeLevel,
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
                    detailJson: { fullName, studentIdCode, major, degreeLevel: resolvedDegreeLevel },
                },
            }),
        ]);

        // Re-assign mandatory activities if profile filters changed
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
        if (user?.status === "APPROVED") {
            await assignMandatoryActivitiesToStudent(userId, {
                scholarshipId: profile.scholarshipId,
                degreeLevel: resolvedDegreeLevel,
                yearLevel,
            });
        }

        revalidatePath(`/admin/users/${userId}`);
        return { success: "อัปเดตข้อมูลนิสิตเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาดในการแก้ไขข้อมูลนิสิต");

export const adminQuickUpdateStudentFieldAction = async (
    userId: string,
    field: "fullName" | "studentIdCode" | "degreeLevel",
    value: string,
) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const trimmed = value.trim();

        if (field === "fullName" && !trimmed) return { error: "กรุณาระบุชื่อ-นามสกุล" };
        if (field === "degreeLevel" && trimmed && !(DEGREE_LEVEL_OPTIONS as readonly string[]).includes(trimmed))
            return { error: "ระดับการศึกษาไม่ถูกต้อง" };

        const profile = await prisma.studentProfile.findUnique({ where: { userId } });
        if (!profile) return { error: "ไม่พบข้อมูลนิสิต" };

        const updateData: Record<string, unknown> = {};
        let yearLevel = profile.yearLevel;

        if (field === "fullName") {
            updateData.fullName = trimmed;
        } else if (field === "studentIdCode") {
            updateData.studentIdCode = trimmed || null;
            yearLevel = trimmed ? computeYearLevel(trimmed) : null;
            updateData.yearLevel = yearLevel;
        } else {
            updateData.degreeLevel = trimmed || null;
        }

        await prisma.$transaction([
            prisma.studentProfile.update({ where: { userId }, data: updateData }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: "STUDENT_PROFILE_UPDATED",
                    targetUserId: userId,
                    detailJson: { field, oldValue: String((profile as Record<string, unknown>)[field] ?? ""), newValue: trimmed || null },
                },
            }),
        ]);

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
        if (user?.status === "APPROVED") {
            await assignMandatoryActivitiesToStudent(userId, {
                scholarshipId: profile.scholarshipId,
                degreeLevel: field === "degreeLevel" ? (trimmed || null) : profile.degreeLevel,
                yearLevel,
            });
        }

        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        return { success: "บันทึกเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");

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

// ── ACTIVITY SUBMISSION REVIEW ────────────────────────────────────────────────

export const reviewActivitySubmissionAction = async (
    submissionId: string,
    status: "VERIFIED" | "REJECTED",
    note?: string
) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const submission = await prisma.activitySubmission.findUnique({
            where: { id: submissionId },
            include: { participation: { select: { userId: true, activityId: true } } },
        });
        if (!submission) return { error: "ไม่พบงานที่ส่ง" };

        const auditAction = status === "VERIFIED" ? "ACTIVITY_SUBMISSION_REVIEWED" : "ACTIVITY_SUBMISSION_REJECTED";

        await prisma.$transaction([
            prisma.activitySubmission.update({
                where: { id: submissionId },
                data: {
                    status,
                    reviewNote: note || null,
                    reviewerAdminId: session.user.id,
                    reviewedAt: new Date(),
                },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: auditAction as import("@prisma/client").AuditAction,
                    targetUserId: submission.participation.userId,
                    detailJson: { submissionId, status, note },
                },
            }),
        ]);

        revalidatePath(`/admin/activities/${submission.participation.activityId}`);
        revalidatePath("/admin/activities");
        revalidatePath("/achievements");
        return { success: status === "VERIFIED" ? "อนุมัติงานเรียบร้อย" : "ปฏิเสธงานเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการตรวจสอบงาน");

// ── ADMIN VERIFY EMAIL ──────────────────────────────────────────────────────

export const adminVerifyEmailAction = async (userId: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const user = await prisma.user.findUnique({
            where: { id: userId, role: "STUDENT" },
            select: { id: true, email: true, emailVerified: true },
        });
        if (!user) return { error: "ไม่พบข้อมูลนิสิต" };
        if (user.emailVerified) return { error: "อีเมลนี้ยืนยันแล้ว" };

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { emailVerified: new Date() },
            }),
            // Clean up any pending verification tokens
            prisma.emailVerificationToken.deleteMany({ where: { userId } }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: "EMAIL_VERIFIED_BY_ADMIN",
                    targetUserId: userId,
                    detailJson: { email: user.email },
                },
            }),
        ]);

        revalidatePath("/admin/users");
        return { success: `ยืนยันอีเมล ${user.email} เรียบร้อยแล้ว` };
    }, "เกิดข้อผิดพลาดในการยืนยันอีเมล");

// ── CHANGE STUDENT SCHOLARSHIP ───────────────────────────────────────────────

export const adminChangeScholarshipAction = async (userId: string, scholarshipId: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        // Verify scholarship exists
        const scholarship = await prisma.scholarship.findUnique({
            where: { id: scholarshipId },
            select: { id: true, name: true },
        });
        if (!scholarship) return { error: "ไม่พบทุนการศึกษาที่เลือก" };

        await prisma.$transaction([
            prisma.studentProfile.update({
                where: { userId },
                data: { scholarshipId },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id,
                    action: "SCHOLARSHIP_CHANGED",
                    targetUserId: userId,
                    detailJson: { scholarshipId, scholarshipName: scholarship.name },
                },
            }),
        ]);

        // Re-assign mandatory activities for new scholarship
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
        const profile = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { degreeLevel: true, yearLevel: true },
        });
        if (user?.status === "APPROVED" && profile) {
            await assignMandatoryActivitiesToStudent(userId, {
                scholarshipId,
                degreeLevel: profile.degreeLevel,
                yearLevel: profile.yearLevel,
            });
        }

        revalidatePath(`/admin/users/${userId}`);
        return { success: `เปลี่ยนทุนการศึกษาเป็น "${scholarship.name}" เรียบร้อยแล้ว` };
    }, "เกิดข้อผิดพลาดในการเปลี่ยนทุนการศึกษา");
