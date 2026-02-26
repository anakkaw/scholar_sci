"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { AchievementSchema } from "@/lib/validations";
import { requireUser, safeAction, revalidateStudentData } from "@/lib/action-helpers";

export const createAchievementAction = async (values: z.infer<typeof AchievementSchema>) =>
    safeAction(async () => {
        const session = await requireUser();

        const validated = AchievementSchema.safeParse(values);
        if (!validated.success) return { error: "ข้อมูลไม่ถูกต้อง" };

        const { type, title, description, date, coAuthors, referenceUrl, attachmentUrl, attachmentName, attachmentSize, attachmentType } = validated.data;

        if (type === "ACTIVITY") return { error: "ประเภทนี้สงวนไว้สำหรับเจ้าหน้าที่เท่านั้น" };

        const achievement = await prisma.achievement.create({
            data: {
                userId: session.user.id, type, title,
                description: description || null, date: date ? new Date(date) : null,
                coAuthors: coAuthors || null, referenceUrl: referenceUrl || null,
            },
        });

        if (attachmentUrl) {
            await prisma.evidenceAttachment.create({
                data: {
                    ownerType: "ACHIEVEMENT", ownerId: achievement.id,
                    fileUrl: attachmentUrl, fileName: attachmentName, fileSizeBytes: attachmentSize, mimeType: attachmentType,
                },
            });
        }

        revalidateStudentData("/achievements");
        return { success: "บันทึกข้อมูลผลงานสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

export const deleteAchievementAction = async (id: string) =>
    safeAction(async () => {
        const session = await requireUser();

        const achievement = await prisma.achievement.findUnique({ where: { id } });
        if (!achievement || achievement.userId !== session.user.id) {
            return { error: "ข้อมูลไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ลบผลงานนี้" };
        }
        if (achievement.type === "ACTIVITY") {
            return { error: "ไม่สามารถลบกิจกรรมบังคับได้ กรุณาติดต่อเจ้าหน้าที่" };
        }

        await prisma.achievement.delete({ where: { id } });
        revalidateStudentData("/achievements");
        return { success: "ลบผลงานสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการลบข้อมูล");
