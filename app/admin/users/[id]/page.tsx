import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    User,
    BookOpen,
    Trophy,
    ClipboardList,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime, formatDate } from "@/lib/utils";
import { USER_STATUS_LABELS, ACHIEVEMENT_TYPES, ACADEMIC_RECORD_STATUS_LABELS, REPORT_STATUS_LABELS } from "@/types/index";
import { GpaEditModal } from "./GpaEditModal";
import { EditStudentProfileModal } from "./EditStudentProfileModal";
import { AchievementReviewButtons } from "./AchievementReviewButtons";
import { ReportReviewButtons } from "./ReportReviewButtons";
import { reviewAcademicRecordAction, updateAttendanceAction } from "@/actions/admin";

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) redirect("/login");

    const [student, participations, progressReports] = await Promise.all([
        prisma.user.findUnique({
            where: { id, role: "STUDENT" },
            include: {
                studentProfile: { include: { scholarship: true } },
                achievements: {
                    where: { type: { not: "ACTIVITY" } },
                    include: { attachments: true },
                    orderBy: { createdAt: "desc" },
                },
                academicRecords: {
                    orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
                },
            },
        }),
        prisma.mandatoryActivityParticipation.findMany({
            where: { userId: id },
            include: { activity: true },
            orderBy: { activity: { createdAt: "desc" } },
        }),
        prisma.progressReport.findMany({
            where: { userId: id },
            include: { milestone: true, attachments: true },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    if (!student) notFound();

    const profile = student.studentProfile;
    const statusInfo = USER_STATUS_LABELS[student.status] ?? { label: student.status, color: "gray" };
    const outputs = student.achievements;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                    <Link href="/admin/users">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        กลับ
                    </Link>
                </Button>
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-14 w-14 border-2 border-amber-200 dark:border-amber-700 shadow-sm flex-shrink-0">
                        <AvatarImage
                            src={profile?.profileImageUrl || student.image || ""}
                            alt={profile?.fullName || student.email || ""}
                        />
                        <AvatarFallback className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xl font-bold">
                            {(profile?.fullName || student.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="text-2xl font-bold tracking-tight truncate">
                            {profile?.fullName ?? "ไม่ระบุชื่อ"}
                        </h2>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4 text-amber-700" />
                            ข้อมูลนิสิต
                        </CardTitle>
                        {profile && (
                            <EditStudentProfileModal
                                userId={student.id}
                                currentProfile={{
                                    fullName: profile.fullName,
                                    nickname: profile.nickname,
                                    studentIdCode: profile.studentIdCode,
                                    major: profile.major,
                                    phone: profile.phone,
                                    backupEmail: profile.backupEmail,
                                    address: profile.address,
                                }}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Profile photo (if uploaded via profile settings) */}
                    {(profile?.profileImageUrl || student.image) && (
                        <div className="mb-5 flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-gray-700">
                            <Avatar className="h-20 w-20 border-2 border-amber-100 dark:border-amber-800/40 shadow">
                                <AvatarImage
                                    src={profile?.profileImageUrl || student.image || ""}
                                    alt={profile?.fullName || student.email || ""}
                                />
                                <AvatarFallback className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 text-2xl font-bold">
                                    {(profile?.fullName || student.email || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-slate-700 dark:text-gray-200">{profile?.fullName}</p>
                                {profile?.nickname && <p className="text-sm text-muted-foreground">({profile.nickname})</p>}
                                <Badge variant={statusInfo.color as never} className="mt-1">
                                    {statusInfo.label}
                                </Badge>
                            </div>
                        </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <InfoRow label="รหัสนิสิต" value={profile?.studentIdCode ?? "-"} />
                        <InfoRow label="ชื่อ-นามสกุล" value={profile?.fullName ?? "-"} />
                        <InfoRow label="ชื่อเล่น" value={profile?.nickname ?? "-"} />
                        <InfoRow
                            label="สถานะ"
                            value={
                                <Badge variant={statusInfo.color as never}>
                                    {statusInfo.label}
                                </Badge>
                            }
                        />
                        <InfoRow
                            label="ทุนการศึกษา"
                            value={profile?.scholarship?.name ?? "-"}
                        />
                        <InfoRow label="สาขาวิชา (ภาควิชา)" value={profile?.major ?? "-"} />
                        <InfoRow label="ชั้นปี" value={profile?.yearLevel ? `ปีที่ ${profile.yearLevel}` : "-"} />
                        <InfoRow
                            label="อีเมล"
                            value={
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {student.email}
                                </span>
                            }
                        />
                        {profile?.phone && (
                            <InfoRow
                                label="โทรศัพท์"
                                value={
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        {profile.phone}
                                    </span>
                                }
                            />
                        )}
                        {profile?.address && (
                            <InfoRow
                                label="ที่อยู่"
                                value={
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        {profile.address}
                                    </span>
                                }
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Academic Records */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4 text-amber-700" />
                        ผลการเรียน (GPA) — {student.academicRecords.length} รายการ
                    </CardTitle>
                    <CardDescription>
                        แก้ไขค่า GPA และยืนยัน/ปฏิเสธผลการเรียนของนิสิต
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {student.academicRecords.length === 0 ? (
                        <EmptyState text="ยังไม่มีข้อมูลผลการเรียน" />
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-gray-800/80">
                                        <TableHead>ปีการศึกษา</TableHead>
                                        <TableHead>ภาคเรียน</TableHead>
                                        <TableHead>GPA</TableHead>
                                        <TableHead>GPAX</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead>หมายเหตุ</TableHead>
                                        <TableHead>เอกสาร</TableHead>
                                        <TableHead className="text-right">จัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {student.academicRecords.map((rec) => {
                                        const recStatus = ACADEMIC_RECORD_STATUS_LABELS[rec.status] ?? { label: rec.status, color: "gray" };
                                        return (
                                            <TableRow key={rec.id}>
                                                <TableCell className="font-medium">{rec.academicYear}</TableCell>
                                                <TableCell>{rec.semester}</TableCell>
                                                <TableCell>
                                                    <span className="text-lg font-bold text-amber-700">
                                                        {rec.gpa.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-lg font-bold text-indigo-700">
                                                        {rec.gpax != null ? rec.gpax.toFixed(2) : "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={recStatus.color as never}>
                                                        {recStatus.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                                                    {rec.reviewNote ?? "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {rec.transcriptUrl ? (
                                                        <a
                                                            href={rec.transcriptUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            ดูเอกสาร
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <GpaEditModal
                                                            recordId={rec.id}
                                                            currentGpa={rec.gpa}
                                                            currentGpax={rec.gpax}
                                                            academicYear={rec.academicYear}
                                                            semester={rec.semester}
                                                        />
                                                        {rec.status !== "REJECTED" && (
                                                            <RejectGpaButton recordId={rec.id} />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mandatory Activities */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Trophy className="h-4 w-4 text-amber-700" />
                                กิจกรรมบังคับ — {participations.length} รายการ
                            </CardTitle>
                            <CardDescription>
                                สถานะการเข้าร่วมกิจกรรมที่ทุนกำหนด · จัดการกิจกรรมได้ที่{" "}
                                <Link href="/admin/activities" className="text-amber-700 hover:underline">
                                    หน้ากิจกรรมบังคับ
                                </Link>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {participations.length === 0 ? (
                        <EmptyState text="ไม่มีกิจกรรมบังคับที่กำหนดให้นิสิตคนนี้" />
                    ) : (
                        <div className="border rounded-md divide-y">
                            {participations.map(p => (
                                <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                        <p className="text-sm font-medium">{p.activity.title}</p>
                                    </div>
                                    <form action={async () => {
                                        "use server";
                                        await updateAttendanceAction(p.id, !p.attended, student.id);
                                    }}>
                                        <Button
                                            type="submit"
                                            variant={p.attended ? "default" : "outline"}
                                            size="sm"
                                            className={p.attended
                                                ? "bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                                                : "text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-600 h-7 px-3 text-xs"
                                            }
                                        >
                                            {p.attended ? "✓ เข้าร่วมแล้ว" : "ยังไม่ได้เข้าร่วม"}
                                        </Button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Student Portfolio */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4 w-4 text-amber-700" />
                        ผลงานส่วนตัวนิสิต — {outputs.length} รายการ
                    </CardTitle>
                    <CardDescription>
                        ตรวจสอบและยืนยันผลงานที่นิสิตบันทึก
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {outputs.length === 0 ? (
                        <EmptyState text="ยังไม่มีผลงานส่วนตัว" />
                    ) : (
                        <div className="border rounded-md divide-y">
                            {outputs.map(ach => {
                                const typeInfo = ACHIEVEMENT_TYPES.find(t => t.value === ach.type);
                                const vStatus = ach.verificationStatus ?? "PENDING";
                                const vLabel = vStatus === "VERIFIED" ? "ยืนยันแล้ว" : vStatus === "REJECTED" ? "ปฏิเสธ" : "รอตรวจสอบ";
                                const vColor = vStatus === "VERIFIED" ? "green" : vStatus === "REJECTED" ? "red" : "yellow";
                                return (
                                    <div key={ach.id} className="p-3 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                    {typeInfo?.label ?? ach.type}
                                                </Badge>
                                                <span className="text-sm font-medium">{ach.title}</span>
                                                <Badge variant={vColor as never} className="text-[10px] shrink-0">
                                                    {vLabel}
                                                </Badge>
                                            </div>
                                            <AchievementReviewButtons achievementId={ach.id} currentStatus={vStatus} />
                                        </div>
                                        {ach.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{ach.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {ach.date && <span>{formatDate(ach.date)}</span>}
                                            {ach.attachments?.length > 0 && (
                                                <a href={ach.attachments[0].fileUrl ?? "#"} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-amber-700 hover:underline">
                                                    <ExternalLink className="h-3 w-3" />ดูเอกสาร
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Progress Reports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardList className="h-4 w-4 text-amber-700" />
                        รายงานความก้าวหน้า — {progressReports.length} รายการ
                    </CardTitle>
                    <CardDescription>
                        ตรวจสอบและยืนยันรายงานความก้าวหน้าของนิสิต
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {progressReports.length === 0 ? (
                        <EmptyState text="ยังไม่มีรายงานความก้าวหน้า" />
                    ) : (
                        <div className="border rounded-md divide-y">
                            {progressReports.map(report => {
                                const rStatus = REPORT_STATUS_LABELS[report.status] ?? { label: report.status, color: "gray" };
                                return (
                                    <div key={report.id} className="p-3 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <span className="text-sm font-medium">
                                                    {report.milestone?.title ?? `รายงาน ${report.academicYear}/${report.semester}`}
                                                </span>
                                                <Badge variant={rStatus.color as never} className="text-[10px] shrink-0">
                                                    {rStatus.label}
                                                </Badge>
                                            </div>
                                            <ReportReviewButtons reportId={report.id} currentStatus={report.status} />
                                        </div>
                                        {report.summary && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{report.summary}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>ปีการศึกษา {report.academicYear} ภาค {report.semester}</span>
                                            {report.submittedAt && <span>ส่งเมื่อ {formatDateTime(report.submittedAt)}</span>}
                                            {report.attachments?.length > 0 && (
                                                <a href={report.attachments[0].fileUrl ?? "#"} target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-amber-700 hover:underline">
                                                    <ExternalLink className="h-3 w-3" />ดูเอกสาร
                                                </a>
                                            )}
                                        </div>
                                        {report.reviewNote && (
                                            <p className="text-xs text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-700/50 rounded px-2 py-1">
                                                หมายเหตุ: {report.reviewNote}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm font-medium">{value}</div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="text-center py-10 text-muted-foreground text-sm">{text}</div>
    );
}


function RejectGpaButton({ recordId }: { recordId: string }) {
    return (
        <form
            action={async () => {
                "use server";
                await reviewAcademicRecordAction(recordId, "REJECTED");
            }}
        >
            <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
                ปฏิเสธ
            </Button>
        </form>
    );
}
