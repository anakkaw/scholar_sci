import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementForm } from "@/components/student/achievement-form";
import { formatDate } from "@/lib/utils";
import { ACHIEVEMENT_TYPES } from "@/types/index";
import { FileText, Trash, ExternalLink, Trophy, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAchievementAction } from "@/actions/achievement";

export default async function AchievementsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [participations, achievements] = await Promise.all([
        prisma.mandatoryActivityParticipation.findMany({
            where: { userId: session.user.id },
            include: { activity: true },
            orderBy: { activity: { date: "desc" } },
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
        <div className="relative rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
            <div className="pl-5 pr-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase border border-slate-200 rounded-full px-2 py-0.5">
                            {getTypeLabel(achievement.type)}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-800 leading-snug mt-1">{achievement.title}</h4>
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
                    <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-100 flex-wrap">
                        <span className="text-[11px] text-slate-400">ไฟล์แนบ:</span>
                        {achievement.attachments.map(att => (
                            <a key={att.id} href={att.fileUrl || "#"} target="_blank" rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
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

                <div className="flex justify-end pt-1 border-t border-dashed border-slate-100">
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

            {/* Section 1: Mandatory Activities (admin-recorded) */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                        <div>
                            <CardTitle className="text-sm font-semibold">กิจกรรมบังคับ</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                กิจกรรมที่ทุนกำหนดให้เข้าร่วม · {participations.length} รายการ
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {participations.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                                <CalendarCheck className="w-7 h-7 text-amber-200" />
                            </div>
                            <p className="text-sm text-slate-500">ยังไม่มีกิจกรรมบังคับที่กำหนดให้</p>
                        </div>
                    ) : (
                        participations.map(p => (
                            <div key={p.id} className="relative rounded-xl border border-amber-100 bg-amber-50/40 overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
                                <div className="pl-5 pr-4 py-3 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-semibold text-sm text-slate-800 leading-snug">{p.activity.title}</h4>
                                        {p.attended ? (
                                            <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                                                ✓ เข้าร่วมแล้ว
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                                                ยังไม่ได้เข้าร่วม
                                            </span>
                                        )}
                                    </div>
                                    {p.activity.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{p.activity.description}</p>
                                    )}
                                    {p.activity.date && (
                                        <p className="text-[11px] text-muted-foreground">📅 {formatDate(p.activity.date)}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

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
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <Trophy className="w-7 h-7 text-slate-200" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500">ยังไม่มีผลงาน</p>
                                <p className="text-xs text-muted-foreground mt-0.5">คลิก "เพิ่มผลงาน" เพื่อบันทึกผลงานของคุณ</p>
                            </div>
                        </div>
                    ) : portfolio.map(a => <PortfolioCard key={a.id} achievement={a} />)}
                </CardContent>
            </Card>
        </div>
    );
}
