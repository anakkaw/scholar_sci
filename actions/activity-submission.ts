"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { ActivitySubmissionSchema } from "@/lib/validations";
import { requireUser, safeAction, revalidateStudentData } from "@/lib/action-helpers";

export const submitActivityWorkAction = async (values: z.infer<typeof ActivitySubmissionSchema>) =>
    safeAction(async () => {
        const session = await requireUser();

        const validated = ActivitySubmissionSchema.safeParse(values);
        if (!validated.success) return { error: "ข้อมูลไม่ถูกต้อง" };

        const { participationId, message, attachmentUrl, attachmentName, attachmentSize, attachmentType } = validated.data;

        // Verify participation belongs to this user
        const participation = await prisma.mandatoryActivityParticipation.findUnique({
            where: { id: participationId },
            select: { id: true, userId: true },
        });
        if (!participation || participation.userId !== session.user.id) {
            return { error: "ไม่พบกิจกรรมนี้ หรือคุณไม่มีสิทธิ์ส่งงาน" };
        }

        const submission = await prisma.activitySubmission.create({
            data: {
                participationId,
                message: message || null,
            },
        });

        if (attachmentUrl) {
            await prisma.evidenceAttachment.create({
                data: {
                    ownerType: "ACTIVITY_SUBMISSION",
                    ownerId: submission.id,
                    fileUrl: attachmentUrl,
                    fileName: attachmentName,
                    fileSizeBytes: attachmentSize,
                    mimeType: attachmentType,
                },
            });
        }

        revalidateStudentData("/achievements");
        return { success: "ส่งงานเรียบร้อยแล้ว รอเจ้าหน้าที่ตรวจสอบ" };
    }, "เกิดข้อผิดพลาดในการส่งงาน");

export const deleteActivitySubmissionAction = async (submissionId: string) =>
    safeAction(async () => {
        const session = await requireUser();

        const submission = await prisma.activitySubmission.findUnique({
            where: { id: submissionId },
            include: { participation: { select: { userId: true } } },
        });

        if (!submission || submission.participation.userId !== session.user.id) {
            return { error: "ไม่พบงานที่ส่ง หรือคุณไม่มีสิทธิ์ลบ" };
        }

        if (submission.status === "VERIFIED") {
            return { error: "ไม่สามารถลบงานที่ผ่านการตรวจแล้ว" };
        }

        await prisma.activitySubmission.delete({ where: { id: submissionId } });
        revalidateStudentData("/achievements");
        return { success: "ลบงานที่ส่งเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาดในการลบงาน");
