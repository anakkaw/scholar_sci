import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementForm } from "@/components/student/achievement-form";
import { ActivitySubmissionForm } from "@/components/student/activity-submission-form";
import { formatDate } from "@/lib/utils";
import { ACHIEVEMENT_TYPES } from "@/types/index";
import { FileText, Trash, ExternalLink, Trophy, CalendarCheck, Clock, CheckCircle2, XCircle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAchievementAction } from "@/actions/achievement";
import { deleteActivitySubmissionAction } from "@/actions/activity-submission";

export default async function AchievementsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [participations, achievements] = await Promise.all([
        prisma.mandatoryActivityParticipation.findMany({
            where: { userId: session.user.id },
            include: {
                activity: {
                include: { requirements: { orderBy: { orderIndex: "asc" } } },
            },
                submissions: {
                    include: { attachments: true },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { activity: { createdAt: "desc" } },
        }),
        prisma.achievement.findMany({
            where: { userId: session.user.id, type: { not: "ACTIVITY" } },
            include: { attachments: true },
            orderBy: { date: "desc" },
        }),
    ]);

    const portfolio = achievements;

    const getTypeLabel = (val: string) => ACHIEVEMENT_TYPES.find(t => t.value === val)?.label ?? val;

    const PortfolioCard = ({ achievement }: { achievement: typeof achievements[number] }) => (
        <div className="relative rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            <div className="pl-5 pr-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-gray-400 uppercase border border-slate-200 dark:border-gray-600 rounded-full px-2 py-0.5">
                            {getTypeLabel(achievement.type)}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-gray-200 leading-snug mt-1">{achievement.title}</h4>
                    </div>
                </div>

                {achievement.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{achievement.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {achievement.date && (
                        <span>📅 {formatDate(achievement.date)}</span>
                    )}
                    {achievement.coAuthors && (
                        <span>👥 {achievement.coAuthors}</span>
                    )}
                </div>

                {achievement.attachments.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-100 dark:border-gray-700 flex-wrap">
                        <span className="text-[11px] text-slate-400 dark:text-gray-500">ไฟล์แนบ:</span>
                        {achievement.attachments.map(att => (
                            <a key={att.id} href={att.fileUrl || "#"} target="_blank" rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" />{att.fileName}
                            </a>
                        ))}
                    </div>
                )}

                {achievement.referenceUrl && (
                    <a href={achievement.referenceUrl} target="_blank" rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> ลิงก์อ้างอิง
                    </a>
                )}

                <div className="flex justify-end pt-1 border-t border-dashed border-slate-100 dark:border-gray-700">
                    <form action={async () => {
                        "use server";
                        await deleteAchievementAction(achievement.id);
                    }}>
                        <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs rounded-lg">
                            <Trash className="w-3 h-3 mr-1" /> ลบ
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold tracking-widest text-amber-500/70 uppercase mb-1">เงื่อนไขที่ 2</p>
                    <h2 className="text-2xl font-bold tracking-tight">กิจกรรมและผลงาน</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">กิจกรรมบังคับจากทุน และผลงานส่วนตัวของนิสิต</p>
                </div>
                <AchievementForm />
            </div>

            {/* Section 1: Mandatory Activities */}
            <div className="rounded-xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-gray-700">
                    <CalendarCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">กิจกรรมบังคับ</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{participations.length} รายการ</span>
                </div>
                {participations.length === 0 ? (
                    <div className="flex items-center gap-2.5 px-4 py-3.5">
                        <p className="text-xs text-slate-400 dark:text-gray-500">ยังไม่มีกิจกรรมบังคับที่กำหนดให้</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-gray-700/60">
                        {participations.map(p => {
                            const latestSubmission = p.submissions[0];
                            const isPassed = p.attended || latestSubmission?.status === "VERIFIED";
                            const hasPending = latestSubmission?.status === "PENDING";
                            const hasRejected = latestSubmission?.status === "REJECTED";

                            return (
                                <div key={p.id} className="px-4 py-3 space-y-2">
                                    {/* Activity title + status */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 dark:text-gray-300 leading-snug">{p.activity.title}</p>
                                            {p.activity.description && (
                                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{p.activity.description}</p>
                                            )}
                                            {p.activity.requirements.length > 0 && (
                                                <div className="mt-1.5 flex items-start gap-1.5">
                                                    <ListChecks className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {p.activity.requirements.map((r, i) => (
                                                            <span key={r.id}>
                                                                {r.title}{i < p.activity.requirements.length - 1 ? " · " : ""}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isPassed ? (
                                                <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> ผ่าน
                                                </span>
                                            ) : hasPending ? (
                                                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> รอตรวจ
                                                </span>
                                            ) : hasRejected ? (
                                                <span className="text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> ไม่ผ่าน
                                                </span>
                                            ) : (
                                                <ActivitySubmissionForm
                                                    participationId={p.id}
                                                    activityTitle={p.activity.title}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Submission details */}
                                    {latestSubmission && (
                                        <div className="ml-0 space-y-1.5">
                                            {latestSubmission.message && (
                                                <p className="text-[11px] text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                                                    {latestSubmission.message}
                                                </p>
                                            )}

                                            {latestSubmission.attachments.length > 0 && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] text-slate-400 dark:text-gray-500">ไฟล์แนบ:</span>
                                                    {latestSubmission.attachments.map(att => (
                                                        <a key={att.id} href={att.fileUrl || "#"} target="_blank" rel="noreferrer"
                                                            className="text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />{att.fileName}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Rejected: show review note + resubmit */}
                                            {hasRejected && (
                                                <div className="space-y-2">
                                                    {latestSubmission.reviewNote && (
                                                        <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                                                            หมายเหตุจากเจ้าหน้าที่: {latestSubmission.reviewNote}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <ActivitySubmissionForm
                                                            participationId={p.id}
                                                            activityTitle={p.activity.title}
                                                            triggerLabel="ส่งใหม่"
                                                        />
                                                        <form action={async () => {
                                                            "use server";
                                                            await deleteActivitySubmissionAction(latestSubmission.id);
                                                        }}>
                                                            <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs">
                                                                <Trash className="w-3 h-3 mr-1" /> ลบ
                                                            </Button>
                                                        </form>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pending: show delete option */}
                                            {hasPending && (
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteActivitySubmissionAction(latestSubmission.id);
                                                }}>
                                                    <Button type="submit" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs">
                                                        <Trash className="w-3 h-3 mr-1" /> ยกเลิกการส่ง
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Section 2: Student Portfolio */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-slate-400 to-slate-500" />
                            <div>
                                <CardTitle className="text-sm font-semibold">ผลงานส่วนตัว</CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    บทความ รางวัล สิทธิบัตร โครงการ และผลงานอื่นๆ — {portfolio.length} รายการ
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {portfolio.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center">
                                <Trophy className="w-7 h-7 text-slate-200 dark:text-gray-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">ยังไม่มีผลงาน</p>
                                <p className="text-xs text-muted-foreground mt-0.5">คลิก "เพิ่มผลงาน" เพื่อบันทึกผลงานของคุณ</p>
                            </div>
                        </div>
                    ) : portfolio.map(a => <PortfolioCard key={a.id} achievement={a} />)}
                </CardContent>
            </Card>
        </div>
    );
}
