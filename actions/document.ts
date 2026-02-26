"use server";

import { prisma } from "@/lib/prisma";
import { DocumentSchema } from "@/lib/validations";
import { z } from "zod";
import { requireAdmin, safeAction, revalidateDocuments } from "@/lib/action-helpers";

export const createDocumentAction = async (data: z.infer<typeof DocumentSchema>) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const parsedData = DocumentSchema.parse({
            ...data,
            scholarshipId: data.scholarshipScope === "ALL" ? null : data.scholarshipId,
        });

        await prisma.$transaction([
            prisma.document.create({
                data: {
                    title: parsedData.title, category: parsedData.category,
                    scholarshipScope: parsedData.scholarshipScope, scholarshipId: parsedData.scholarshipId,
                    fileUrl: parsedData.fileUrl, fileName: parsedData.fileName,
                    fileSizeBytes: parsedData.fileSizeBytes, mimeType: parsedData.mimeType,
                    isPublished: parsedData.isPublished, uploadedById: session.user.id,
                },
            }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id, action: "DOCUMENT_UPLOADED",
                    detailJson: { title: parsedData.title, fileUrl: parsedData.fileUrl },
                },
            }),
        ]);

        revalidateDocuments();
        return { success: "อัปโหลดและบันทึกเอกสารเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการบันทึกข้อมูลเอกสาร");

export const toggleDocumentPublishAction = async (documentId: string, isPublished: boolean) =>
    safeAction(async () => {
        await requireAdmin();
        await prisma.document.update({ where: { id: documentId }, data: { isPublished } });
        revalidateDocuments();
        return { success: `อัปเดตสถานะการเผยแพร่เป็น ${isPublished ? "เปิด" : "ปิด"} เรียบร้อย` };
    }, "เกิดข้อผิดพลาดในการอัปเดตสถานะเอกสาร");

export const deleteDocumentAction = async (documentId: string) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const doc = await prisma.document.findUnique({ where: { id: documentId } });
        if (!doc) return { error: "ไม่พบเอกสาร" };

        await prisma.$transaction([
            prisma.document.delete({ where: { id: documentId } }),
            prisma.auditLog.create({
                data: {
                    actorAdminId: session.user.id, action: "DOCUMENT_DELETED",
                    detailJson: { title: doc.title, fileUrl: doc.fileUrl },
                },
            }),
        ]);

        revalidateDocuments();
        return { success: "ลบเอกสารออกจากระบบเรียบร้อย" };
    }, "เกิดข้อผิดพลาดในการลบเอกสาร");
