import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate, formatFileSize } from "@/lib/utils";
import { FileText, Download, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getPublishedDocuments = unstable_cache(
    () => prisma.document.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
    }),
    ["published-documents"],
    { tags: ["documents"], revalidate: 3600 }
);

export default async function DocumentsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const documents = await getPublishedDocuments();

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">

            {/* Page Header */}
            <div>
                <p className="text-[11px] font-semibold tracking-widest text-amber-500/70 uppercase mb-1">ดาวน์โหลด</p>
                <h2 className="text-2xl font-bold tracking-tight">คลังเอกสาร</h2>
                <p className="text-sm text-muted-foreground mt-0.5">แบบฟอร์ม ประกาศ และเอกสารสำคัญจากโครงการ</p>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-blue-500" />
                        <div>
                            <CardTitle className="text-sm font-semibold">เอกสารดาวน์โหลด</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{documents.length} ไฟล์ทั้งหมด</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center py-14 gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <FolderOpen className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">ยังไม่มีเอกสารในระบบ</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {documents.map(doc => (
                                <div key={doc.id}
                                    className="group rounded-xl border border-slate-100 bg-white hover:shadow-md hover:border-blue-100 transition-all overflow-hidden flex flex-col">
                                    {/* Top accent */}
                                    <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
                                    <div className="p-4 flex flex-col flex-1 gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm leading-snug line-clamp-2 text-slate-800" title={doc.title}>
                                                    {doc.title}
                                                </h4>
                                                {doc.category && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-100 text-blue-600">
                                                        {doc.category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                                                <div>{doc.fileSizeBytes ? formatFileSize(doc.fileSizeBytes) : "—"}</div>
                                                <div>{formatShortDate(doc.updatedAt)}</div>
                                            </div>
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl transition-colors shadow-sm">
                                                <Download className="w-3.5 h-3.5" />
                                                ดาวน์โหลด
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
