"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { ProfileSchema } from "@/lib/validations";
import { computeYearLevel } from "@/lib/utils";
import { requireUser, safeAction, revalidateStudentData } from "@/lib/action-helpers";

export const updateProfileAction = async (values: z.infer<typeof ProfileSchema>) =>
    safeAction(async () => {
        const session = await requireUser();

        const validatedFields = ProfileSchema.safeParse(values);
        if (!validatedFields.success) return { error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" };

        const { fullName, nickname, studentIdCode, major, faculty, degreeLevel, phone, backupEmail, address, profileImageUrl } = validatedFields.data;
        const yearLevel = studentIdCode ? computeYearLevel(studentIdCode) : null;

        await prisma.studentProfile.update({
            where: { userId: session.user.id },
            data: {
                fullName,
                nickname: nickname || null,
                studentIdCode: studentIdCode || null,
                major: major === "" ? null : major || null,
                faculty: faculty || null,
                degreeLevel: degreeLevel === "" ? null : degreeLevel || null,
                yearLevel,
                phone: phone || null,
                backupEmail: backupEmail === "" ? null : backupEmail,
                address: address || null,
                ...(profileImageUrl ? { profileImageUrl } : {}),
            },
        });

        revalidateStudentData("/profile");
        return { success: "บันทึกข้อมูลส่วนตัวสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
