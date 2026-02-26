import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportForm } from "@/components/student/report-form";
import { formatDateTime } from "@/lib/utils";
import { REPORT_STATUS_LABELS, YEAR_LABELS, SEMESTER_LABELS } from "@/types/index";
import { FileText, Trash, DownloadCloud, CheckCircle2, Clock, Lock } from "lucide-react";
import { deleteReportAction } from "@/actions/report";

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const [studentProfile, submissions] = await Promise.all([
        prisma.studentProfile.findUnique({
            where: { userId },
            include: {
                scholarship: {
                    include: {
                        milestones: {
                            orderBy: [{ targetYearLevel: "asc" }, { targetSemester: "asc" }, { orderIndex: "asc" }],
                        },
                    },
                },
            },
        }),
        prisma.progressReport.findMany({
            where: { userId },
            include: { milestone: true, attachments: true },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const milestones = studentProfile?.scholarship?.milestones ?? [];
    const submissionByMilestone = new Map(
        submissions.filter(s => s.milestoneId).map(s => [s.milestoneId!, s])
    );

    const submittedCount = milestones.filter(m => submissionByMilestone.has(m.id)).length;
    const progressPct = milestones.length > 0 ? Math.round((submittedCount / milestones.length) * 100) : 0;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-3xl mx-auto">

            {/* Page Header */}
            <div>
                <p className="text-[11px] font-semibold tracking-widest text-amber-500/70 uppercase mb-1">เงื่อนไขที่ 3</p>
                <h2 className="text-2xl font-bold tracking-tight">รายงานโครงงาน</h2>
                <p className="text-sm text-muted-foreground mt-0.5">ส่งรายงานตาม milestone ที่โครงการกำหนด</p>
            </div>

            {/* Progress summary */}
            {milestones.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/40 px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-green-900">ความคืบหน้าการส่งรายงาน</p>
                            <p className="text-xs text-green-600/70 mt-0.5">ส่งแล้ว {submittedCount} จาก {milestones.length} รายการ</p>
                        </div>
                        <span className="text-2xl font-bold text-green-700">{progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-green-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                            style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            )}

            {/* Milestones */}
            {milestones.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center py-14 gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-slate-300 dark:text-gray-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">ยังไม่มีการกำหนดรายงานสำหรับทุนนี้</p>
                            <p className="text-xs text-muted-foreground mt-0.5">กรุณาติดต่อผู้ดูแลโครงการ</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-green-400 to-emerald-500" />
                            <div>
                                <CardTitle className="text-sm font-semibold">รายการรายงานที่ต้องส่ง</CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    {milestones.length} รายการทั้งหมด
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {milestones.map((milestone, idx) => {
                            const submission = submissionByMilestone.get(milestone.id);
                            const statusInfo = submission
                                ? (REPORT_STATUS_LABELS[submission.status] ?? { label: submission.status, color: "gray" })
                                : null;
                            const isDone = !!submission;
                            const isLocked = submission?.status === "REVIEWED";

                            return (
                                <div key={milestone.id}
                                    className={`relative rounded-xl overflow-hidden border transition-shadow hover:shadow-sm ${isDone ? "border-green-100 dark:border-green-800/40 bg-green-50/30 dark:bg-green-900/20" : "border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800"}`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${isDone ? "from-green-400 to-emerald-500" : "from-amber-300 to-amber-400"}`} />

                                    <div className="pl-5 pr-4 py-4 space-y-3">
                                        {/* Milestone header */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold
                                                    ${isDone ? "bg-green-500 text-white" : "bg-amber-100 text-amber-700"}`}>
                                                    {isDone ? "✓" : idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-semibold text-sm text-slate-800 dark:text-gray-200 leading-snug">{milestone.title}</h4>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        กำหนดส่ง: {YEAR_LABELS[milestone.targetYearLevel] ?? `ปี ${milestone.targetYearLevel}`} — {SEMESTER_LABELS[milestone.targetSemester] ?? `เทอม ${milestone.targetSemester}`}
                                                    </p>
                                                    {milestone.description && (
                                                        <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">{milestone.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {submission ? (
                                                <Badge variant={statusInfo?.color as any} className="shrink-0 text-[10px]">{statusInfo?.label}</Badge>
                                            ) : (
                                                <Badge variant="outline" className="shrink-0 text-[10px] text-amber-600 border-amber-200">รอส่ง</Badge>
                                            )}
                                        </div>

                                        {/* Submission details */}
                                        {submission ? (
                                            <div className="space-y-2 pl-8">
                                                <p className="text-[11px] text-muted-foreground">
                                                    ส่งเมื่อ {formatDateTime(submission.submittedAt ?? submission.createdAt)}
                                                </p>
                                                {submission.summary && (
                                                    <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                        {submission.summary}
                                                    </div>
                                                )}
                                                {submission.reviewNote && (
                                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 px-3 py-2 rounded-lg text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                                        <span className="font-semibold">ข้อเสนอแนะ: </span>{submission.reviewNote}
                                                    </div>
                                                )}
                                                {submission.attachments.length > 0 && (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[11px] text-slate-400 dark:text-gray-500">ไฟล์แนบ:</span>
                                                        {submission.attachments.map(att => (
                                                            <a key={att.id} href={att.fileUrl ?? "#"} target="_blank" rel="noreferrer"
                                                                className="text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                                <DownloadCloud className="w-3 h-3" />
                                                                {att.fileName ?? "ดาวน์โหลดไฟล์"}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex justify-end pt-1 border-t border-dashed border-slate-100 dark:border-gray-700">
                                                    {isLocked ? (
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-gray-500">
                                                            <Lock className="w-3 h-3" /> ล็อกแล้ว (ตรวจสอบแล้ว)
                                                        </div>
                                                    ) : (
                                                        <form action={async () => {
                                                            "use server";
                                                            await deleteReportAction(submission.id);
                                                        }}>
                                                            <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 h-7 px-2 text-xs rounded-lg">
                                                                <Trash className="w-3 h-3 mr-1" /> ยกเลิกการส่ง
                                                            </Button>
                                                        </form>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pl-8">
                                                <ReportForm
                                                    milestoneId={milestone.id}
                                                    milestoneTitle={milestone.title}
                                                    triggerLabel="ส่งรายงานนี้"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
