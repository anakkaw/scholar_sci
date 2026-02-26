"use server";

import { prisma } from "@/lib/prisma";

export const verifyEmailAction = async (token: string) => {
    if (!token) {
        return { error: "ลิงก์ยืนยันไม่ถูกต้อง" };
    }

    const record = await prisma.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!record) {
        return { error: "ลิงก์ยืนยันไม่ถูกต้องหรือถูกใช้งานไปแล้ว" };
    }

    if (record.expiresAt < new Date()) {
        // Clean up expired token
        await prisma.emailVerificationToken.delete({ where: { id: record.id } });
        return { error: "ลิงก์ยืนยันหมดอายุแล้ว กรุณาลงทะเบียนใหม่" };
    }

    if (record.user.emailVerified) {
        // Already verified — just clean up and succeed
        await prisma.emailVerificationToken.delete({ where: { id: record.id } });
        return { success: "อีเมลของคุณได้รับการยืนยันแล้ว" };
    }

    // Mark email as verified and delete the token in one transaction
    await prisma.$transaction([
        prisma.user.update({
            where: { id: record.userId },
            data: { emailVerified: new Date() },
        }),
        prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    return { success: "ยืนยันอีเมลสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว" };
};
