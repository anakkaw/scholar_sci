import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AcademicForm } from "@/components/student/academic-form";
import { formatDateTime, getEnrollmentYear } from "@/lib/utils";
import { ACADEMIC_RECORD_STATUS_LABELS, STATUS_ACCENT, SEMESTER_LABELS } from "@/types/index";
import { GraduationCap, Trash, FileText, ExternalLink } from "lucide-react";
import { deleteAcademicRecordAction } from "@/actions/academic";

export default async function AcademicPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [records, profile] = await Promise.all([
        prisma.academicRecord.findMany({
            where: { userId: session.user.id },
            orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
        }),
        prisma.studentProfile.findUnique({
            where: { userId: session.user.id },
            select: { studentIdCode: true },
        }),
    ]);

    const enrollmentYear = getEnrollmentYear(profile?.studentIdCode);
    const bestGpa = records.length > 0 ? Math.max(...records.map(r => r.gpa)) : null;
    const latestGpax = records.length > 0 ? records[0].gpax : null;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-3xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold tracking-widest text-amber-500/70 uppercase mb-1">เงื่อนไขที่ 1</p>
                    <h2 className="text-2xl font-bold tracking-tight">ผลการเรียน</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">บันทึก GPA และ GPAX พร้อมแนบ Transcript ในแต่ละภาคเรียน</p>
                </div>
                <AcademicForm enrollmentYear={enrollmentYear} />
            </div>

            {/* Summary cards */}
            {bestGpa !== null && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800/40 px-4 py-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center shadow-md shadow-blue-200/50 flex-shrink-0">
                            <span className="text-white text-base font-bold leading-tight">{bestGpa.toFixed(2)}</span>
                            <span className="text-blue-100/80 text-[10px] font-medium">GPA</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">GPA สูงสุด</p>
                            <p className="text-[11px] text-blue-600/60 dark:text-blue-400/60 mt-0.5">{records.length} ภาคเรียนที่บันทึก</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border border-indigo-100 dark:border-indigo-800/40 px-4 py-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex flex-col items-center justify-center shadow-md shadow-indigo-200/50 flex-shrink-0">
                            <span className="text-white text-base font-bold leading-tight">
                                {latestGpax != null ? latestGpax.toFixed(2) : "-"}
                            </span>
                            <span className="text-indigo-100/80 text-[10px] font-medium">GPAX</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">GPAX ล่าสุด</p>
                            <p className="text-[11px] text-indigo-600/60 dark:text-indigo-400/60 mt-0.5">เกรดเฉลี่ยสะสม</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Records List */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-blue-500" />
                        <div>
                            <CardTitle className="text-sm font-semibold">ประวัติผลการเรียน</CardTitle>
                            <CardDescription className="text-xs mt-0.5">รายการ GPA ทั้งหมดที่บันทึกไว้</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {records.length === 0 ? (
                        <div className="flex flex-col items-center py-14 gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center">
                                <GraduationCap className="w-8 h-8 text-slate-300 dark:text-gray-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">ยังไม่มีการบันทึกผลการเรียน</p>
                                <p className="text-xs text-muted-foreground mt-0.5">คลิก "บันทึกผลการเรียน" เพื่อเพิ่มข้อมูล</p>
                            </div>
                        </div>
                    ) : (
                        records.map(record => {
                            const statusInfo = ACADEMIC_RECORD_STATUS_LABELS[record.status] || { label: record.status, color: "gray" };
                            const accent = STATUS_ACCENT[record.status] ?? "from-slate-300 to-slate-400";
                            return (
                                <div key={record.id} className="relative rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accent}`} />
                                    <div className="pl-5 pr-4 py-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-800 dark:text-gray-200">
                                                    {SEMESTER_LABELS[record.semester] || `ภาคเรียนที่ ${record.semester}`} — ปีการศึกษา {record.academicYear}
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    บันทึกเมื่อ {formatDateTime(record.createdAt)}
                                                </p>
                                            </div>
                                            <Badge variant={statusInfo.color as any} className="shrink-0 text-[10px]">
                                                {statusInfo.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-baseline gap-1 bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-2">
                                                <span className="text-[10px] text-blue-400 font-medium mr-0.5">GPA</span>
                                                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{record.gpa.toFixed(2)}</span>
                                                <span className="text-xs text-blue-400 font-medium">/ 4.00</span>
                                            </div>
                                            {record.gpax != null && (
                                                <div className="flex items-baseline gap-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-4 py-2">
                                                    <span className="text-[10px] text-indigo-400 font-medium mr-0.5">GPAX</span>
                                                    <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{record.gpax.toFixed(2)}</span>
                                                    <span className="text-xs text-indigo-400 font-medium">/ 4.00</span>
                                                </div>
                                            )}
                                            {record.transcriptUrl && (
                                                <a href={record.transcriptUrl} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800/40 px-3 py-2 rounded-xl transition-colors">
                                                    <FileText className="w-3 h-3" />
                                                    {record.transcriptName || "Transcript"}
                                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                                </a>
                                            )}
                                        </div>
                                        {record.reviewNote && (
                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 px-3 py-2 rounded-lg text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                                <span className="font-semibold">หมายเหตุจากเจ้าหน้าที่: </span>{record.reviewNote}
                                            </div>
                                        )}
                                        {record.status !== "VERIFIED" && (
                                            <div className="flex justify-end pt-1 border-t border-dashed border-slate-100 dark:border-gray-700">
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteAcademicRecordAction(record.id);
                                                }}>
                                                    <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs rounded-lg">
                                                        <Trash className="w-3 h-3 mr-1" /> ลบ
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
