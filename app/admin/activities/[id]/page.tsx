import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, CheckCircle2, Clock, FileText, ListChecks } from "lucide-react";
import { AttendanceToggleButton } from "./AttendanceToggleButton";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";
import { SubmissionList } from "./SubmissionList";

export default async function ActivityAttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

    const activity = await prisma.mandatoryActivity.findUnique({
        where: { id },
        include: {
            scholarship: { select: { name: true } },
            requirements: { orderBy: { orderIndex: "asc" } },
            participations: {
                include: {
                    user: {
                        select: {
                            id: true,
                            studentProfile: {
                                select: {
                                    fullName: true,
                                    studentIdCode: true,
                                    faculty: true,
                                    degreeLevel: true,
                                    yearLevel: true,
                                },
                            },
                        },
                    },
                    submissions: {
                        include: { attachments: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { user: { studentProfile: { fullName: "asc" } } },
            },
        },
    });

    if (!activity) notFound();

    const total = activity.participations.length;
    const attended = activity.participations.filter(p => p.attended).length;
    const passedBySubmission = activity.participations.filter(p =>
        !p.attended && p.submissions.some(s => s.status === "VERIFIED")
    ).length;
    const totalPassed = attended + passedBySubmission;
    const pendingSubmissions = activity.participations.reduce(
        (count, p) => count + (p.submissions.some(s => s.status === "PENDING") ? 1 : 0), 0
    );
    const pct = total > 0 ? Math.round((totalPassed / total) * 100) : 0;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/activities">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        กลับ
                    </Link>
                </Button>
            </div>

            {/* Activity Info */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{activity.title}</h2>
                {activity.description && (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-xs">
                        {activity.scholarship?.name ?? "ทุกทุน"}
                    </Badge>
                    {activity.degreeLevel && (
                        <Badge variant="outline" className="text-xs">
                            {activity.degreeLevel}
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                        {activity.yearLevel ? `ปีที่ ${activity.yearLevel}` : "ทุกชั้นปี"}
                    </Badge>
                </div>
            </div>

            {/* Requirements */}
            {activity.requirements.length > 0 && (
                <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">งานที่ต้องส่ง ({activity.requirements.length} รายการ)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                        {activity.requirements.map(req => (
                            <li key={req.id} className="text-sm text-slate-700 dark:text-gray-300">{req.title}</li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
                    <div className="text-2xl font-bold text-slate-700 dark:text-gray-200">{total}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">นิสิตทั้งหมด</div>
                </div>
                <div className="rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/20 p-4 text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{totalPassed}</div>
                    <div className="text-[11px] text-green-600/70 dark:text-green-400/70 mt-0.5">ผ่านแล้ว</div>
                </div>
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/20 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pendingSubmissions}</div>
                    <div className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">รอตรวจงาน</div>
                </div>
                <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/20 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pct}%</div>
                    <div className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">อัตราผ่าน</div>
                </div>
            </div>

            {/* Progress bar */}
            {total > 0 && (
                <div className="h-2 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}

            {/* Attendance & Submissions List */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                        <div>
                            <CardTitle className="text-sm font-semibold">รายชื่อนิสิต</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                คลิกที่สถานะเพื่อเปลี่ยนการเข้าร่วม หรือตรวจงานที่นิสิตส่ง
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {activity.participations.length === 0 ? (
                        <div className="flex flex-col items-center py-12 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center">
                                <Users className="w-7 h-7 text-slate-200 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-gray-400">ยังไม่มีนิสิตที่กำหนดให้เข้าร่วมกิจกรรมนี้</p>
                        </div>
                    ) : activity.participations.map((p, idx) => {
                        const profile = p.user.studentProfile;
                        const latestSubmission = p.submissions[0];

                        return (
                            <div
                                key={p.id}
                                className="rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 hover:shadow-sm transition-shadow space-y-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Index */}
                                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-slate-500 dark:text-gray-400 shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">
                                                {profile?.fullName ?? "ไม่ระบุชื่อ"}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                {profile?.studentIdCode && (
                                                    <span className="text-[11px] text-muted-foreground">{profile.studentIdCode}</span>
                                                )}
                                                {profile?.degreeLevel && (
                                                    <span className="text-[11px] text-muted-foreground">{profile.degreeLevel}</span>
                                                )}
                                                {profile?.yearLevel && (
                                                    <span className="text-[11px] text-muted-foreground">ปีที่ {profile.yearLevel}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <AttendanceToggleButton
                                            participationId={p.id}
                                            userId={p.user.id}
                                            attended={p.attended}
                                        />
                                    </div>
                                </div>

                                {/* Submissions info */}
                                {p.submissions.length > 0 && (
                                    <SubmissionList
                                        submissions={p.submissions}
                                        studentName={profile?.fullName ?? "ไม่ระบุชื่อ"}
                                    />
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Summary row */}
            {total > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ผ่านแล้ว: <span className="font-semibold text-green-700 dark:text-green-300">{totalPassed}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-400" />
                            ยังไม่ผ่าน: <span className="font-semibold text-amber-700 dark:text-amber-300">{total - totalPassed}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
