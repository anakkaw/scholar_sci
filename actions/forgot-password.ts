"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { ForgotPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import * as z from "zod";

export async function forgotPasswordAction(values: z.infer<typeof ForgotPasswordSchema>) {
    const validated = ForgotPasswordSchema.safeParse(values);
    if (!validated.success) {
        return { error: "ข้อมูลไม่ถูกต้อง" };
    }

    const { email } = validated.data;

    // Rate limit: 3 request ต่อ 10 นาที ต่อ email — ป้องกัน email bombing
    const rl = rateLimit(`forgot-pwd:${email.toLowerCase()}`, 3, 10 * 60_000);
    if (!rl.allowed) {
        const waitMin = Math.ceil(rl.retryAfterSec / 60);
        return { error: `คุณส่งคำขอบ่อยเกินไป กรุณารอ ${waitMin} นาทีแล้วลองใหม่` };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to not leak whether email exists
        if (!user || !user.passwordHash) {
            return { success: "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว" };
        }

        // Delete any existing reset tokens for this user
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        // Create new reset token (expires in 1 hour)
        const token = await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        await sendPasswordResetEmail(email, token.token);

        return { success: "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว" };
    } catch (error) {
        console.error("Forgot password error:", error);
        return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
    }
}
