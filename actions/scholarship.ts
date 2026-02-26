"use server";

import { prisma } from "@/lib/prisma";
import { ScholarshipSchema } from "@/lib/validations";
import { z } from "zod";
import { requireAdmin, safeAction, revalidateScholarships } from "@/lib/action-helpers";

export const toggleScholarshipStatusAction = async (scholarshipId: string, active: boolean) =>
    safeAction(async () => {
        await requireAdmin();
        await prisma.scholarship.update({ where: { id: scholarshipId }, data: { active } });
        revalidateScholarships();
        return { success: `อัปเดตสถานะทุนเป็น ${active ? "เปิดรับ" : "ปิดรับ"} แล้ว` };
    }, "เกิดข้อผิดพลาดในการอัปเดตสถานะ");

export const saveScholarshipAction = async (scholarshipId: string | null, data: z.infer<typeof ScholarshipSchema>) =>
    safeAction(async () => {
        await requireAdmin();
        const parsedData = ScholarshipSchema.parse(data);

        const milestonesData = parsedData.milestones?.map((m, i) => ({
            title: m.title,
            description: m.description,
            targetYearLevel: m.targetYearLevel,
            targetSemester: m.targetSemester,
            orderIndex: m.orderIndex ?? i,
        })) || [];

        const scholarshipData = {
            name: parsedData.name,
            description: parsedData.description,
            active: parsedData.active,
            minGpa: parsedData.minGpa === "" ? null : (parsedData.minGpa ?? null),
            minGpax: parsedData.minGpax === "" ? null : (parsedData.minGpax ?? null),
        };

        if (scholarshipId && scholarshipId !== "new") {
            await prisma.scholarship.update({
                where: { id: scholarshipId },
                data: { ...scholarshipData, milestones: { deleteMany: {}, create: milestonesData } },
            });
            revalidateScholarships();
            return { success: "บันทึกการแก้ไขทุนการศึกษาเรียบร้อย" };
        }

        await prisma.scholarship.create({
            data: { ...scholarshipData, milestones: { create: milestonesData } },
        });
        revalidateScholarships();
        return { success: "สร้างโครงการทุนการศึกษาใหม่เรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

export const deleteScholarshipAction = async (scholarshipId: string) =>
    safeAction(async () => {
        await requireAdmin();
        await prisma.scholarship.delete({ where: { id: scholarshipId } });
        revalidateScholarships();
        return { success: "ลบทุนการศึกษาเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาด หรือทุนนี้ไม่อนุญาตให้ลบ (อาจมีนิสิตผูกอยู่)");
