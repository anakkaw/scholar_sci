"use server";

import { prisma } from "@/lib/prisma";
import { ResetPasswordSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import * as z from "zod";

export async function resetPasswordAction(token: string, values: z.infer<typeof ResetPasswordSchema>) {
    const validated = ResetPasswordSchema.safeParse(values);
    if (!validated.success) {
        return { error: "ข้อมูลไม่ถูกต้อง" };
    }

    if (!token) {
        return { error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง" };
    }

    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return { error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือถูกใช้งานแล้ว" };
        }

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
            return { error: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่" };
        }

        const passwordHash = await bcrypt.hash(validated.data.password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            }),
            prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
        ]);

        return { success: "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่" };
    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
    }
}

export async function validateResetTokenAction(token: string) {
    if (!token) return { valid: false };
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) return { valid: false };
    return { valid: true };
}
