import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    GraduationCap,
    Trophy,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    Mail,
    Phone,
    Sparkles,
} from "lucide-react";
import { ACADEMIC_RECORD_STATUS_LABELS, SEMESTER_LABELS } from "@/types/index";

// ── SVG Decorations ──────────────────────────────────────────────────────────

function HeroBgDecor() {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="92%" cy="-20%" r="180" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="1.5" />
            <circle cx="92%" cy="-20%" r="130" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="1" />
            <circle cx="92%" cy="-20%" r="80" fill="rgba(251,191,36,0.07)" stroke="rgba(251,191,36,0.18)" strokeWidth="1" />
            <circle cx="85%" cy="30%" r="4" fill="rgba(251,191,36,0.3)" />
            <circle cx="88%" cy="55%" r="2.5" fill="rgba(251,191,36,0.2)" />
            <circle cx="75%" cy="80%" r="3" fill="rgba(251,191,36,0.15)" />
            <path d="M580 80 l8 -8 l8 8 l-8 8 Z" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
            <path d="M540 110 l5 -5 l5 5 l-5 5 Z" fill="rgba(251,191,36,0.12)" />
            <line x1="60%" y1="15%" x2="80%" y2="15%" stroke="rgba(251,191,36,0.15)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="65%" y1="85%" x2="82%" y2="85%" stroke="rgba(251,191,36,0.1)" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
    );
}

function GpaRing({ value, max = 4.0 }: { value: number; max?: number }) {
    const r = 26;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    const dash = pct * circ;
    return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0" aria-label={`GPA: ${value}`}>
            <circle cx="36" cy="36" r={r} fill="none" stroke="#dbeafe" strokeWidth="5" />
            <circle
                cx="36" cy="36" r={r}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={circ * 0.25}
                transform="rotate(-90 36 36)"
                opacity="0.8"
            />
            <text x="36" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d4ed8" fontFamily="inherit">
                {value.toFixed(2)}
            </text>
        </svg>
    );
}


function MilestoneProgressBar({ submitted, total }: { submitted: number; total: number }) {
    const pct = total > 0 ? (submitted / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>ความคืบหน้า</span>
                <span className="font-semibold text-green-700">{Math.round(pct)}%</span>
            </div>
            <div className="h-2 rounded-full bg-green-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function CardBgShape({ color }: { color: string }) {
    return (
        <svg
            className="absolute top-0 right-0 h-full w-24 opacity-[0.06] pointer-events-none"
            viewBox="0 0 96 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="80" cy="20" r="60" fill={color} />
            <circle cx="90" cy="100" r="40" fill={color} />
        </svg>
    );
}

function ContactDecor() {
    return (
        <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none"
            width="80" height="60"
            viewBox="0 0 80 60"
            fill="none"
            aria-hidden="true"
        >
            <rect x="5" y="10" width="70" height="45" rx="8" stroke="#92400e" strokeWidth="1.5" fill="none" />
            <path d="M5 20 L40 38 L75 20" stroke="#92400e" strokeWidth="1.5" fill="none" />
            <circle cx="18" cy="52" r="3" fill="#92400e" />
            <circle cx="62" cy="52" r="3" fill="#92400e" />
        </svg>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const session = await getSession();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const userProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        include: {
            scholarship: {
                include: {
                    milestones: {
                        // Only fetch the two fields actually used in the UI
                        select: { id: true, title: true },
                        orderBy: [{ targetYearLevel: "asc" }, { orderIndex: "asc" }],
                    },
                },
            },
        },
    });

    if (!userProfile) redirect("/select-scholarship");

    const [latestAcademicRecord, submittedReports, mandatoryParticipations] = await Promise.all([
        prisma.academicRecord.findFirst({
            where: { userId },
            orderBy: [{ academicYear: "desc" }, { semester: "desc" }],
        }),
        prisma.progressReport.findMany({
            where: { userId, milestoneId: { not: null } },
            select: { milestoneId: true },
        }),
        prisma.mandatoryActivityParticipation.findMany({
            where: { userId },
            select: { attended: true },
        }),
    ]);

    const submittedMilestoneIds = new Set(submittedReports.map(r => r.milestoneId));
    const totalMilestones = userProfile.scholarship?.milestones?.length ?? 0;
    const submittedMilestonesCount = submittedMilestoneIds.size;
    const pendingMilestones = (userProfile.scholarship?.milestones ?? []).filter(
        m => !submittedMilestoneIds.has(m.id)
    );

    const academicStatusInfo = latestAcademicRecord
        ? (ACADEMIC_RECORD_STATUS_LABELS[latestAcademicRecord.status] ?? { label: latestAcademicRecord.status, color: "gray" })
        : null;

    // Mandatory activities
    const mandatoryTotal = mandatoryParticipations.length;
    const mandatoryAttended = mandatoryParticipations.filter(p => p.attended).length;

    // Scholarship thresholds
    const minGpa = userProfile.scholarship?.minGpa ?? null;
    const minGpax = userProfile.scholarship?.minGpax ?? null;
    const gpaOk = minGpa == null || (latestAcademicRecord != null && latestAcademicRecord.gpa >= minGpa);
    const gpaxOk = minGpax == null || (latestAcademicRecord?.gpax != null && latestAcademicRecord.gpax >= minGpax);

    const isApproved = session.user.status === "APPROVED";

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">

            {/* ── Hero Banner ─────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-700 via-amber-600 to-orange-500 px-6 py-7 md:px-8 md:py-9 text-white shadow-lg shadow-amber-200/50">
                <HeroBgDecor />
                <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-200" />
                            <span className="text-amber-200 text-xs font-medium tracking-wider uppercase">
                                ScholarSci Dashboard
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
                            สวัสดี, {userProfile.fullName.split(" ")[0]} 👋
                        </h1>
                        <p className="text-amber-100/80 text-sm mt-1 max-w-md">
                            {userProfile.scholarship?.name || "ยังไม่ระบุทุนการศึกษา"}
                        </p>
                    </div>
                    <Badge
                        variant={isApproved ? "success" : "warning"}
                        className="shrink-0 text-sm px-3 py-1 font-semibold rounded-full shadow-sm"
                    >
                        {isApproved ? "✓ สถานะปกติ" : "⏳ รออนุมัติ"}
                    </Badge>
                </div>

                {/* Quick stats row */}
                <div className="relative z-10 mt-6 grid grid-cols-3 gap-3">
                    {[
                        { label: "GPA ล่าสุด", value: latestAcademicRecord ? latestAcademicRecord.gpa.toFixed(2) : "—" },
                        { label: "กิจกรรมบังคับ", value: mandatoryTotal > 0 ? `${mandatoryAttended}/${mandatoryTotal}` : "—" },
                        { label: "รายงาน", value: totalMilestones > 0 ? `${submittedMilestonesCount}/${totalMilestones}` : "—" },
                    ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2.5 border border-white/15">
                            <div className="text-lg font-bold leading-tight">{value}</div>
                            <div className="text-amber-200/70 text-[11px] mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Section divider ─────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                <span className="text-xs font-semibold tracking-widest text-amber-500/70 uppercase px-1">
                    เงื่อนไขของทุน
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-amber-200 to-transparent" />
            </div>

            {/* ── 3 Condition Cards ───────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-3">

                {/* Card 1: GPA */}
                <Card className="relative overflow-hidden border-0 shadow-md shadow-blue-100/50 bg-white dark:bg-gray-800 hover:shadow-lg hover:shadow-blue-100/60 transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-500 rounded-l-lg" />
                    <CardBgShape color="#3b82f6" />
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 pl-5">
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-blue-500/70 uppercase mb-0.5">เงื่อนไขที่ 1</p>
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-gray-300">ผลการเรียน (GPA)</CardTitle>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="pl-5 pb-4 space-y-3">
                        {latestAcademicRecord ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <GpaRing value={latestAcademicRecord.gpa} />
                                    <div className="space-y-1.5">
                                        <div className="text-[11px] text-muted-foreground">
                                            {SEMESTER_LABELS[latestAcademicRecord.semester] ?? `เทอม ${latestAcademicRecord.semester}`}
                                            {" "}&bull;{" "}ปี {latestAcademicRecord.academicYear}
                                        </div>
                                        {latestAcademicRecord.gpax != null && (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[10px] text-indigo-400 font-medium">GPAX</span>
                                                <span className="text-sm font-bold text-indigo-700">{latestAcademicRecord.gpax.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <Badge variant={academicStatusInfo?.color as any} className="text-[10px] px-2 py-0.5">
                                            {academicStatusInfo?.label}
                                        </Badge>
                                    </div>
                                </div>
                                {/* Threshold indicators */}
                                {(minGpa != null || minGpax != null) && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {minGpa != null && (
                                            <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${gpaOk ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                                                {gpaOk ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                GPA ≥ {minGpa.toFixed(2)}
                                            </div>
                                        )}
                                        {minGpax != null && (
                                            <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${gpaxOk ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                                                {gpaxOk ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                GPAX ≥ {minGpax.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 py-2">
                                <XCircle className="w-4 h-4 text-slate-300" />
                                <div>
                                    <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
                                    <p className="text-[11px] text-muted-foreground">กรุณาบันทึกผลการเรียน</p>
                                </div>
                            </div>
                        )}
                        <Link href="/academic">
                            <Button variant="outline" size="sm" className="w-full text-xs border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-xl">
                                ดูรายละเอียด <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Card 2: Activities */}
                <Card className="relative overflow-hidden border-0 shadow-md shadow-amber-100/50 bg-white dark:bg-gray-800 hover:shadow-lg hover:shadow-amber-100/60 transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500 rounded-l-lg" />
                    <CardBgShape color="#f59e0b" />
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 pl-5">
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-amber-500/70 uppercase mb-0.5">เงื่อนไขที่ 2</p>
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-gray-300">การเข้าร่วมกิจกรรม</CardTitle>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Trophy className="h-4 w-4 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="pl-5 pb-4 space-y-3">
                        {mandatoryTotal > 0 ? (
                            <div className="space-y-1.5">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-bold text-amber-700">{mandatoryAttended}</span>
                                    <span className="text-base text-muted-foreground font-normal">/ {mandatoryTotal}</span>
                                    <span className="text-xs text-muted-foreground ml-0.5">กิจกรรมบังคับ</span>
                                </div>
                                <MilestoneProgressBar submitted={mandatoryAttended} total={mandatoryTotal} />
                                <div className="flex items-center gap-1.5">
                                    {mandatoryAttended === mandatoryTotal ? (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-[11px] text-green-600 font-medium">เข้าร่วมครบทุกกิจกรรมบังคับ</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-[11px] text-amber-700 font-medium">รอเข้าร่วมอีก {mandatoryTotal - mandatoryAttended} กิจกรรม</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 py-2">
                                <Clock className="w-4 h-4 text-slate-300" />
                                <div>
                                    <p className="text-sm text-slate-400">ยังไม่มีกิจกรรมบังคับ</p>
                                    <p className="text-[11px] text-muted-foreground">ผู้ดูแลยังไม่ได้กำหนดกิจกรรมบังคับ</p>
                                </div>
                            </div>
                        )}
                        <Link href="/achievements">
                            <Button variant="outline" size="sm" className="w-full text-xs border-amber-100 text-amber-700 hover:bg-amber-50 hover:border-amber-200 rounded-xl">
                                ดูรายละเอียด <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Card 3: Milestones */}
                <Card className="relative overflow-hidden border-0 shadow-md shadow-green-100/50 bg-white dark:bg-gray-800 hover:shadow-lg hover:shadow-green-100/60 transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-l-lg" />
                    <CardBgShape color="#10b981" />
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 pl-5">
                        <div>
                            <p className="text-[11px] font-semibold tracking-wider text-green-500/70 uppercase mb-0.5">เงื่อนไขที่ 3</p>
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-gray-300">รายงานโครงงาน</CardTitle>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="pl-5 pb-4 space-y-3">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-green-700">{submittedMilestonesCount}</span>
                            {totalMilestones > 0 && (
                                <span className="text-base text-muted-foreground font-normal">/ {totalMilestones}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-0.5">รายงาน</span>
                        </div>

                        {totalMilestones > 0 && (
                            <MilestoneProgressBar submitted={submittedMilestonesCount} total={totalMilestones} />
                        )}

                        {pendingMilestones.length > 0 ? (
                            <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/30 flex items-start gap-1.5">
                                <Clock className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                                <span className="leading-snug">รอส่ง: <span className="font-medium">{pendingMilestones[0].title}</span></span>
                            </div>
                        ) : totalMilestones > 0 ? (
                            <div className="flex items-center gap-1.5 text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">ส่งครบทุก milestone แล้ว</span>
                            </div>
                        ) : (
                            <p className="text-[11px] text-muted-foreground">ยังไม่มี milestone ที่กำหนด</p>
                        )}

                        <Link href="/reports">
                            <Button variant="outline" size="sm" className="w-full text-xs border-green-100 text-green-700 hover:bg-green-50 hover:border-green-200 rounded-xl">
                                ดูรายละเอียด <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* ── Milestone Timeline ──────────────────────────── */}
            {totalMilestones > 0 && (
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-gray-300">ความคืบหน้า Milestone</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {(userProfile.scholarship?.milestones ?? []).map((m, idx) => {
                                const done = submittedMilestoneIds.has(m.id);
                                const isLast = idx === (userProfile.scholarship?.milestones?.length ?? 0) - 1;
                                return (
                                    <div key={m.id} className="flex items-center gap-2">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all
                                                ${done
                                                    ? "bg-green-500 border-green-500 text-white shadow-sm shadow-green-200"
                                                    : "bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-400 dark:text-gray-500"
                                                }`}>
                                                {done ? "✓" : idx + 1}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground max-w-[60px] text-center leading-tight truncate">{m.title}</span>
                                        </div>
                                        {!isLast && (
                                            <div className={`w-8 h-0.5 mb-4 rounded-full ${done ? "bg-green-300 dark:bg-green-700" : "bg-slate-100 dark:bg-gray-700"}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Contact Card ────────────────────────────────── */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 shadow-sm">
                <ContactDecor />
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <Mail className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-300">ติดต่อผู้ดูแลโครงการ</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 text-sm text-amber-800/80 dark:text-amber-300/80">
                            <Mail className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span>info@scholarsci.ac.th</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-amber-800/80 dark:text-amber-300/80">
                            <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span>02-xxx-xxxx</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
