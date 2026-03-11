"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const resendVerificationAction = async (email: string) => {
    if (!email) return { error: "กรุณาระบุอีเมล" };

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 2 ครั้งต่อ 5 นาที ต่อ email — ป้องกัน email bombing
    const rl = rateLimit(`resend-verify:${normalizedEmail}`, 2, 5 * 60_000);
    if (!rl.allowed) {
        const waitMin = Math.ceil(rl.retryAfterSec / 60);
        return { error: `ส่งอีเมลบ่อยเกินไป กรุณารอ ${waitMin} นาทีแล้วลองใหม่` };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, emailVerified: true },
        });

        // ส่ง success เสมอเพื่อป้องกัน email enumeration
        if (!user || user.emailVerified) {
            return { success: "หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ยืนยันไปแล้ว" };
        }

        // ลบ token เก่าทั้งหมดของ user นี้
        await prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id },
        });

        // สร้าง token ใหม่ (24 ชั่วโมง)
        const record = await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        await sendVerificationEmail(normalizedEmail, record.token);

        return { success: "ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam" };
    } catch (error) {
        console.error("Failed to resend verification email:", error);
        return { error: "ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณาลองใหม่ภายหลัง" };
    }
};
