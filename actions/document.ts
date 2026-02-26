"use server";

import { prisma } from "@/lib/prisma";
import { DocumentSchema } from "@/lib/validations";
import { z } from "zod";
import { requireAdmin, safeAction, revalidateDocuments } from "@/lib/action-helpers";

export const createDocumentAction = async (data: z.infer<typeof DocumentSchema>) =>
    safeAction(async () => {
        const session = await requireAdmin();

        const parsedData = DocumentSchema.parse(data);
        const scholarshipIds = parsedData.scholarshipScope === "ALL" ? [] : parsedData.scholarshipIds;

        await prisma.$transaction([
            prisma.document.create({
                data: {
                    title: parsedData.title, category: parsedData.category,
                    scholarshipScope: parsedData.scholarshipScope,
                    fileUrl: parsedData.fileUrl, fileName: parsedData.fileName,
                    fileSizeBytes: parsedData.fileSizeBytes, mimeType: parsedData.mimeType,
                    isPublished: parsedData.isPublished, uploadedById: session.user.id,
                    scholarships: scholarshipIds.length > 0
                        ? { connect: scholarshipIds.map(id => ({ id })) }
                        : undefined,
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
