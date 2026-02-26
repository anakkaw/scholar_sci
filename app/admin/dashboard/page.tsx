import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BookOpen,
    Trophy,
    ClipboardList,
    ArrowRight,
    Clock,
    Users,
    GraduationCap,
} from "lucide-react";
import Link from "next/link";

function AdminHeroBg() {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="95%" cy="-30%" r="200" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="1.5" />
            <circle cx="95%" cy="-30%" r="140" fill="none" stroke="rgba(251,191,36,0.10)" strokeWidth="1" />
            <circle cx="95%" cy="-30%" r="80" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.16)" strokeWidth="1" />
            <circle cx="82%" cy="25%" r="3.5" fill="rgba(253,230,138,0.35)" />
            <circle cx="86%" cy="60%" r="2" fill="rgba(253,230,138,0.25)" />
            <line x1="55%" y1="12%" x2="72%" y2="12%" stroke="rgba(253,230,138,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
    );
}

function StatCardAccent({ color }: { color: string }) {
    return (
        <svg className="absolute top-0 right-0 h-full w-16 pointer-events-none" viewBox="0 0 64 80" fill="none" aria-hidden="true">
            <circle cx="56" cy="12" r="36" fill={color} opacity="0.07" />
            <circle cx="60" cy="68" r="24" fill={color} opacity="0.04" />
        </svg>
    );
}

function ComplianceBar({ submitted, total }: { submitted: number; total: number }) {
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return (
        <div className="space-y-1.5 mt-1">
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-gray-700 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="text-[10px] text-muted-foreground">{pct}% จากนิสิตทั้งหมด</div>
        </div>
    );
}

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [
        totalStudents,
        pendingApprovals,
        activeScholarships,
        pendingReports,
        pendingAcademicRecords,
        pendingAchievements,
        gpaSubmittedCount,
        activityCount,
        milestoneReportCount,
    ] = await Promise.all([
        prisma.user.count({ where: { role: "STUDENT", status: "APPROVED" } }),
        prisma.user.count({ where: { role: "STUDENT", status: "PENDING" } }),
        prisma.scholarship.count({ where: { active: true } }),
        prisma.progressReport.count({ where: { status: "SUBMITTED" } }),
        prisma.academicRecord.count({ where: { status: "PENDING" } }),
        prisma.achievement.count({ where: { verificationStatus: "PENDING" } }),
        prisma.academicRecord
            .findMany({ select: { userId: true }, distinct: ["userId"] })
            .then((r) => r.length),
        prisma.achievement
            .findMany({
                select: { userId: true },
                distinct: ["userId"],
                where: { type: "ACTIVITY" },
            })
            .then((r) => r.length),
        prisma.progressReport
            .findMany({
                select: { userId: true },
                distinct: ["userId"],
                where: { milestoneId: { not: null } },
            })
            .then((r) => r.length),
    ]);

    const totalPending = pendingApprovals + pendingAcademicRecords + pendingAchievements + pendingReports;

    const alertCards = [
        {
            label: "รออนุมัติเข้าใช้งาน",
            value: pendingApprovals,
            Icon: Clock,
            svgColor: "#d97706",
            accentColor: "border-l-amber-400",
            iconBg: "bg-amber-50 dark:bg-amber-900/30",
            iconColor: "text-amber-500",
            numColor: "text-amber-700",
            linkColor: "text-amber-600 hover:text-amber-800",
            href: "/admin/users?status=PENDING",
            linkLabel: "ตรวจสอบ",
        },
        {
            label: "รายงานรอตรวจสอบ",
            value: pendingReports,
            Icon: ClipboardList,
            svgColor: "#10b981",
            accentColor: "border-l-green-400",
            iconBg: "bg-green-50 dark:bg-green-900/20",
            iconColor: "text-green-500",
            numColor: "text-green-700",
            linkColor: "text-green-600 hover:text-green-800",
            href: "/admin/users?pending=reports",
            linkLabel: "ดูรายการ",
        },
        {
            label: "GPA รอตรวจสอบ",
            value: pendingAcademicRecords,
            Icon: BookOpen,
            svgColor: "#3b82f6",
            accentColor: "border-l-blue-400",
            iconBg: "bg-blue-50 dark:bg-blue-900/30",
            iconColor: "text-blue-500",
            numColor: "text-blue-700",
            linkColor: "text-blue-600 hover:text-blue-800",
            href: "/admin/users?pending=gpa",
            linkLabel: "ดูรายการ",
        },
        {
            label: "ผลงานรอตรวจสอบ",
            value: pendingAchievements,
            Icon: Trophy,
            svgColor: "#8b5cf6",
            accentColor: "border-l-purple-400",
            iconBg: "bg-purple-50 dark:bg-purple-900/30",
            iconColor: "text-purple-500",
            numColor: "text-purple-700",
            linkColor: "text-purple-600 hover:text-purple-800",
            href: "/admin/users?pending=achievements",
            linkLabel: "ดูรายการ",
        },
    ] as const;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">

            {/* ── Hero Banner ── */}
            <div className="relative rounded-2xl bg-gradient-to-br from-amber-800 to-amber-700 px-7 py-6 text-white shadow-sm overflow-hidden">
                <AdminHeroBg />
                <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-amber-200/60 text-[11px] font-semibold tracking-widest uppercase mb-1.5">Admin Panel</p>
                        <h1 className="text-2xl font-bold tracking-tight">ภาพรวมระบบ</h1>
                        <p className="text-amber-100/60 text-sm mt-1">ติดตามสถานะนิสิตทุนและงานที่รอดำเนินการ</p>
                    </div>
                    {totalPending > 0 && (
                        <div className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-center min-w-[80px]">
                            <div className="text-2xl font-bold">{totalPending}</div>
                            <div className="text-amber-200/60 text-[11px] mt-0.5">รอดำเนินการ</div>
                        </div>
                    )}
                </div>
                <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-300/60" />
                        <span className="text-sm font-semibold">{totalStudents}</span>
                        <span className="text-amber-200/50 text-xs">นิสิตทุนที่อนุมัติแล้ว</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-300/60" />
                        <span className="text-sm font-semibold">{activeScholarships}</span>
                        <span className="text-amber-200/50 text-xs">โครงการทุนที่เปิดรับ</span>
                    </div>
                </div>
            </div>

            {/* ── 4 Alert Cards ── */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                {alertCards.map(({ label, value, Icon, svgColor, accentColor, iconBg, iconColor, numColor, linkColor, href, linkLabel }) => (
                    <Card key={label} className={`relative overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
                        value > 0
                            ? `border-0 ring-1 ring-inset ring-slate-200/80 dark:ring-gray-700 border-t-2 ${accentColor.replace("border-l-", "border-t-")}`
                            : "border border-slate-100 dark:border-gray-700"
                    }`}>
                        <StatCardAccent color={svgColor} />
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${value > 0 ? iconBg : "bg-slate-50 dark:bg-gray-700"}`}>
                                    <Icon className={`h-4 w-4 ${value > 0 ? iconColor : "text-slate-300 dark:text-gray-600"}`} />
                                </div>
                                {value > 0 && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${iconBg} ${iconColor}`}>ใหม่</span>
                                )}
                            </div>
                            <div className={`text-2xl font-bold tracking-tight ${value > 0 ? numColor : "text-slate-200 dark:text-gray-600"}`}>{value}</div>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</p>
                            <Link href={href} className={`text-[11px] mt-2 flex items-center gap-0.5 font-medium ${value > 0 ? linkColor : "text-slate-300 dark:text-gray-600 pointer-events-none"}`}>
                                {linkLabel} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Compliance Section ── */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-gray-700" />
                    <span className="text-[10px] font-semibold tracking-widest text-slate-400 dark:text-gray-500 uppercase px-1">สรุปการปฏิบัติตามเงื่อนไขทุน</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-gray-700" />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {[
                        {
                            label: "ส่งผลการเรียน (GPA)",
                            badge: "เงื่อนไขที่ 1",
                            value: gpaSubmittedCount,
                            Icon: BookOpen,
                            accent: "border-l-blue-400",
                            badgeColor: "text-blue-400/70",
                            numColor: "text-blue-700",
                            iconBg: "bg-blue-50 dark:bg-blue-900/30",
                            iconColor: "text-blue-500",
                            note: null,
                        },
                        {
                            label: "บันทึกกิจกรรม",
                            badge: "เงื่อนไขที่ 2",
                            value: activityCount,
                            Icon: Trophy,
                            accent: "border-l-amber-400",
                            badgeColor: "text-amber-400/70",
                            numColor: "text-amber-700",
                            iconBg: "bg-amber-50 dark:bg-amber-900/30",
                            iconColor: "text-amber-500",
                            note: "มีกิจกรรมอย่างน้อย 1 รายการ",
                        },
                        {
                            label: "ส่งรายงานความก้าวหน้า",
                            badge: "เงื่อนไขที่ 3",
                            value: milestoneReportCount,
                            Icon: ClipboardList,
                            accent: "border-l-green-400",
                            badgeColor: "text-green-400/70",
                            numColor: "text-green-700",
                            iconBg: "bg-green-50 dark:bg-green-900/20",
                            iconColor: "text-green-500",
                            note: null,
                        },
                    ].map(({ label, badge, value, Icon, accent, badgeColor, numColor, iconBg, iconColor, note }) => (
                        <Card key={label} className={`border border-slate-100 dark:border-gray-700 shadow-sm border-l-4 ${accent}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 pl-4">
                                <div>
                                    <p className={`text-[10px] font-semibold tracking-wider uppercase ${badgeColor}`}>{badge}</p>
                                    <CardTitle className="text-sm font-medium mt-0.5">{label}</CardTitle>
                                </div>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                                </div>
                            </CardHeader>
                            <CardContent className="pl-4 pb-4">
                                <div className="flex items-baseline gap-1.5">
                                    <span className={`text-2xl font-bold ${numColor}`}>{value}</span>
                                    <span className="text-sm font-normal text-muted-foreground">/ {totalStudents} คน</span>
                                </div>
                                <ComplianceBar submitted={value} total={totalStudents} />
                                {note && <p className="text-xs text-muted-foreground mt-1.5">{note}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

        </div>
    );
}
