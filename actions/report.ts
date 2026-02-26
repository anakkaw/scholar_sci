"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { ReportSchema } from "@/lib/validations";
import { requireUser, safeAction, revalidateStudentData } from "@/lib/action-helpers";

export const createReportAction = async (values: z.infer<typeof ReportSchema>) =>
    safeAction(async () => {
        const session = await requireUser();

        const validated = ReportSchema.safeParse(values);
        if (!validated.success) return { error: "ข้อมูลไม่ถูกต้อง" };

        const { milestoneId, academicYear, semester, summary, attachmentUrl, attachmentName, attachmentSize, attachmentType } = validated.data;

        if (milestoneId) {
            const existing = await prisma.progressReport.findFirst({
                where: { userId: session.user.id, milestoneId },
            });
            if (existing) return { error: "คุณได้ส่งรายงานสำหรับ milestone นี้ไปแล้ว" };
        }

        const report = await prisma.progressReport.create({
            data: {
                userId: session.user.id, milestoneId: milestoneId || null,
                academicYear, semester, summary, status: "SUBMITTED", submittedAt: new Date(),
            },
        });

        if (attachmentUrl) {
            await prisma.evidenceAttachment.create({
                data: {
                    ownerType: "REPORT", ownerId: report.id,
                    fileUrl: attachmentUrl, fileName: attachmentName, fileSizeBytes: attachmentSize, mimeType: attachmentType,
                },
            });
        }

        revalidateStudentData("/reports");
        return { success: "ส่งรายงานโครงงานสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

export const deleteReportAction = async (id: string) =>
    safeAction(async () => {
        const session = await requireUser();

        const report = await prisma.progressReport.findUnique({ where: { id } });
        if (!report || report.userId !== session.user.id) {
            return { error: "ข้อมูลไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ลบรายงานนี้" };
        }
        if (report.status === "REVIEWED") {
            return { error: "ไม่สามารถลบรายงานที่ผ่านการตรวจประเมินแล้วได้" };
        }

        await prisma.progressReport.delete({ where: { id } });
        revalidateStudentData("/reports");
        return { success: "ลบรายงานสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการลบข้อมูล");
