"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { MessageThreadSchema, MessageReplySchema } from "@/lib/validations";
import { requireUser, requireAdmin, safeAction } from "@/lib/action-helpers";
import { revalidatePath } from "next/cache";
import { sendNewMessageToAdminEmail, sendReplyToStudentEmail } from "@/lib/email";

// ── Create new thread (student only) ─────────────────────────────────────────

export const createThreadAction = async (
    values: z.infer<typeof MessageThreadSchema>
): Promise<{ success?: string; error?: string; threadId?: string }> =>
    safeAction(async () => {
        const session = await requireUser();
        if (session.user.role !== "STUDENT") return { error: "เฉพาะนิสิตเท่านั้นที่สามารถสร้างข้อความได้" };

        const validated = MessageThreadSchema.safeParse(values);
        if (!validated.success) return { error: "ข้อมูลไม่ถูกต้อง: " + validated.error.errors[0]?.message };

        const { subject, content } = validated.data;

        const thread = await prisma.messageThread.create({
            data: {
                studentId: session.user.id,
                subject,
                lastMessageAt: new Date(),
                messages: {
                    create: { senderId: session.user.id, content },
                },
            },
        });

        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
            if (adminEmail) {
                await sendNewMessageToAdminEmail(adminEmail, session.user.name || session.user.email || "นิสิต", subject, content);
            }
        } catch (e) {
            console.error("Failed to send email to admin:", e);
        }

        revalidatePath("/messages");
        revalidatePath("/admin/messages");
        return { success: "ส่งข้อความสำเร็จ", threadId: thread.id };
    }, "เกิดข้อผิดพลาดในการส่งข้อความ");

// ── Reply to thread (student or admin) ───────────────────────────────────────

export const replyToThreadAction = async (values: z.infer<typeof MessageReplySchema>) =>
    safeAction(async () => {
        const session = await requireUser();

        const validated = MessageReplySchema.safeParse(values);
        if (!validated.success) return { error: "ข้อมูลไม่ถูกต้อง" };

        const { threadId, content } = validated.data;

        const thread = await prisma.messageThread.findUnique({
            where: { id: threadId },
            include: {
                student: {
                    select: {
                        id: true,
                        email: true,
                        studentProfile: { select: { fullName: true } },
                    },
                },
            },
        });

        if (!thread) return { error: "ไม่พบข้อความ" };
        if (thread.status === "CLOSED") return { error: "สนทนานี้ถูกปิดแล้ว ไม่สามารถตอบกลับได้" };

        if (session.user.role === "STUDENT" && thread.studentId !== session.user.id) {
            return { error: "ไม่มีสิทธิ์ในการดำเนินการ" };
        }

        await prisma.$transaction([
            prisma.message.create({ data: { threadId, senderId: session.user.id, content } }),
            prisma.messageThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } }),
        ]);

        try {
            if (session.user.role === "ADMIN") {
                await sendReplyToStudentEmail(
                    thread.student.email,
                    thread.student.studentProfile?.fullName || "นิสิต",
                    session.user.name || "ผู้ดูแลระบบ",
                );
            } else {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
                if (adminEmail) {
                    await sendNewMessageToAdminEmail(
                        adminEmail,
                        session.user.name || session.user.email || "นิสิต",
                        thread.subject,
                        content,
                    );
                }
            }
        } catch (e) {
            console.error("Failed to send reply notification:", e);
        }

        revalidatePath("/messages");
        revalidatePath(`/admin/messages/${threadId}`);
        revalidatePath("/admin/messages");
        return { success: "ส่งข้อความสำเร็จ" };
    }, "เกิดข้อผิดพลาดในการส่งข้อความ");

// ── Close thread (admin only) ─────────────────────────────────────────────────

export const closeThreadAction = async (threadId: string) =>
    safeAction(async () => {
        await requireAdmin();
        await prisma.messageThread.update({ where: { id: threadId }, data: { status: "CLOSED" } });
        revalidatePath(`/admin/messages/${threadId}`);
        revalidatePath("/admin/messages");
        return { success: "ปิดสนทนาเรียบร้อยแล้ว" };
    }, "เกิดข้อผิดพลาด");

// ── Mark thread messages as read ──────────────────────────────────────────────

export const markThreadReadAction = async (threadId: string) =>
    safeAction(async () => {
        const session = await requireUser();
        await prisma.message.updateMany({
            where: { threadId, senderId: { not: session.user.id }, isRead: false },
            data: { isRead: true },
        });
        revalidatePath("/messages");
        revalidatePath("/admin/messages");
        return { success: "ok" };
    }, "เกิดข้อผิดพลาด");
