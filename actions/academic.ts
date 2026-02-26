"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { AcademicRecordSchema } from "@/lib/validations";
import { requireUser, safeAction, revalidateStudentData } from "@/lib/action-helpers";

export const createAcademicRecordAction = async (values: z.infer<typeof AcademicRecordSchema>) =>
    safeAction(async () => {
        const session = await requireUser();

        const validated = AcademicRecordSchema.safeParse(values);
        if (!validated.success) {
            return { error: "ข้อมูลไม่ถูกต้อง: " + validated.error.errors[0]?.message };
        }

        const { academicYear, semester, gpa, gpax, transcriptUrl, transcriptName } = validated.data;

        const existing = await prisma.academicRecord.findUnique({
            where: { userId_academicYear_semester: { userId: session.user.id, academicYear, semester } },
        });
        if (existing) {
            return { error: `คุณได้บันทึกผลการเรียนสำหรับภาคเรียนที่ ${semester}/${academicYear} ไปแล้ว` };
        }

        await prisma.academicRecord.create({
            data: {
                userId: session.user.id, academicYear, semester, gpa, gpax,
                transcriptUrl, transcriptName, status: "PENDING",
            },
        });

        revalidateStudentData("/academic");
        return { success: "บันทึกผลการเรียนสำเร็จ รอการตรวจสอบจากเจ้าหน้าที่" };
    }, "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

export const deleteAcademicRecordAction = async (id: string) =>
    safeAction(async () => {
        const session = await requireUser();

        const record = await prisma.academicRecord.findUnique({ where: { id } });
        if (!record || record.userId !== session.user.id) {
            return { error: "ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์ลบรายการนี้" };
        }
        if (record.status === "VERIFIED") {
            return { error: "ไม่สามารถลบผลการเรียนที่ได้รับการยืนยันแล้ว" };
        }

        await prisma.academicRecord.delete({ where: { id } });
        revalidateStudentData("/academic");
        return { success: "ลบข้อมูลผลการเรียนสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการลบข้อมูล");
