"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";

export const registerAction = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "ข้อมูลไม่ถูกต้อง" };
    }

    const { email, password, fullName, scholarshipId } = validatedFields.data;

    // Server-side domain guard (belt-and-suspenders beyond Zod)
    if (!email.toLowerCase().endsWith("@nu.ac.th")) {
        return { error: "ต้องใช้อีเมลมหาวิทยาลัยนเรศวร (@nu.ac.th) เท่านั้น" };
    }

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "อีเมลนี้มีอยู่ในระบบแล้ว" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        let verificationToken: string;

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    role: "STUDENT",
                    status: "PENDING",
                    // emailVerified remains null until the link is clicked
                },
            });

            await tx.studentProfile.create({
                data: {
                    userId: user.id,
                    fullName,
                    scholarshipId,
                },
            });

            // Create a 24-hour verification token
            const record = await tx.emailVerificationToken.create({
                data: {
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });

            verificationToken = record.token;
        });

        // Send the verification email (outside the transaction so a failure doesn't rollback the user)
        await sendVerificationEmail(email, verificationToken!);

        return {
            success: "ลงทะเบียนสำเร็จ! กรุณาตรวจสอบกล่องจดหมาย @nu.ac.th ของคุณและคลิกลิงก์ยืนยันอีเมลก่อนเข้าสู่ระบบ",
        };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "เกิดข้อผิดพลาดในการลงทะเบียน" };
    }
};
