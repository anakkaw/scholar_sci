import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatShortDate, formatFileSize } from "@/lib/utils";
import { FolderKanban, FileText } from "lucide-react";
import { DocumentFormModal } from "./DocumentFormModal";
import { DocumentStatusToggle } from "./DocumentStatusToggle";
import { DeleteDocumentButton } from "./DeleteDocumentButton";
import Link from "next/link";

export default async function AdminDocumentsPage() {
    const [documents, scholarships] = await Promise.all([
        prisma.document.findMany({
            orderBy: { createdAt: 'desc' },
            include: { scholarships: { select: { id: true, name: true } } }
        }),
        prisma.scholarship.findMany({
            where: { active: true },
            select: { id: true, name: true }
        })
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 mb-4">
                <h2 className="text-3xl font-bold tracking-tight">จัดการคลังเอกสาร</h2>
                <DocumentFormModal scholarships={scholarships} />
            </div>

            <Card className="border-slate-200 dark:border-gray-700 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        คลังเอกสารในระบบ
                    </CardTitle>
                    <CardDescription>
                        จัดการเอกสาร คู่มือ และแบบฟอร์มต่างๆ ที่นิสิตสามารถดาวน์โหลดได้
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                    <div className="border rounded-md min-w-[640px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-gray-700">
                                    <TableHead>ชื่อเอกสาร</TableHead>
                                    <TableHead>หมวดหมู่</TableHead>
                                    <TableHead>สำหรับ</TableHead>
                                    <TableHead>ประเภท/ขนาด</TableHead>
                                    <TableHead>อัปเดตเมื่อ</TableHead>
                                    <TableHead className="text-center">เผยแพร่บนหน้าเว็บ</TableHead>
                                    <TableHead className="text-center">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            ยังไม่มีเอกสารในระบบ
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium max-w-[250px]">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-slate-400 dark:text-gray-500 shrink-0" />
                                                    <Link href={doc.fileUrl} target="_blank" className="hover:underline truncate" title={doc.title}>
                                                        {doc.title}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal bg-slate-50 dark:bg-gray-700">
                                                    {doc.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[160px]">
                                                {doc.scholarshipScope === "ALL" ? (
                                                    <span>ทุกคน</span>
                                                ) : doc.scholarships.length === 0 ? (
                                                    <span className="text-amber-600">ยังไม่ได้ระบุทุน</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.scholarships.map(s => (
                                                            <span key={s.id} className="inline-block bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40 rounded-full px-1.5 py-0 text-[10px] font-medium">
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground space-y-1">
                                                <div>{doc.fileName.split('.').pop()?.toUpperCase()}</div>
                                                <div>{formatFileSize(doc.fileSizeBytes)}</div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatShortDate(doc.updatedAt)}
                                            </TableCell>
                                            <TableCell>
                                                <DocumentStatusToggle id={doc.id} initialState={doc.isPublished} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DeleteDocumentButton id={doc.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
