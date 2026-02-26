import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import {
    Settings,
    User,
    Shield,
    ClipboardList,
    Mail,
    Calendar,
    Users,
} from "lucide-react";
import { CreateAdminForm } from "./CreateAdminForm";

const AUDIT_ACTION_LABELS: Record<string, { label: string; color: string }> = {
    USER_APPROVED: { label: "อนุมัติผู้ใช้", color: "green" },
    USER_REJECTED: { label: "ปฏิเสธผู้ใช้", color: "red" },
    USER_SUSPENDED: { label: "ระงับผู้ใช้", color: "orange" },
    USER_REINSTATED: { label: "คืนสถานะผู้ใช้", color: "blue" },
    SCHOLARSHIP_CHANGED: { label: "แก้ไขทุนการศึกษา", color: "purple" },
    REPORT_REVIEWED: { label: "ตรวจรายงาน", color: "blue" },
    DOCUMENT_UPLOADED: { label: "อัปโหลดเอกสาร", color: "gray" },
    DOCUMENT_DELETED: { label: "ลบเอกสาร", color: "red" },
    ACHIEVEMENT_VERIFIED: { label: "ยืนยันผลงาน", color: "green" },
    ACHIEVEMENT_REJECTED: { label: "ปฏิเสธผลงาน", color: "red" },
};

export default async function AdminSettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [adminUser, auditLogs, adminList, totalStudents] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                image: true,
                createdAt: true,
                role: true,
                status: true,
            },
        }),
        prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                actorAdmin: {
                    select: { email: true, image: true },
                },
                targetUser: {
                    select: {
                        email: true,
                        studentProfile: { select: { fullName: true } },
                    },
                },
            },
        }),
        prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true, email: true, createdAt: true },
            orderBy: { createdAt: "asc" },
        }),
        prisma.user.count({ where: { role: "STUDENT" } }),
    ]);

    const totalAdmins = adminList.length;

    const displayName =
        session.user.name || adminUser?.email?.split("@")[0] || "Admin";

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex items-center gap-3 mb-2">
                <Settings className="h-7 w-7 text-amber-700" />
                <h2 className="text-3xl font-bold tracking-tight">ตั้งค่าระบบ</h2>
            </div>

            {/* Admin Profile Card */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 border-amber-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4 text-amber-700" />
                            บัญชีผู้ดูแลระบบ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-14 w-14 border-2 border-amber-200">
                                <AvatarImage
                                    src={session.user.image || ""}
                                    alt={displayName}
                                />
                                <AvatarFallback className="bg-amber-100 text-amber-700 text-lg font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-base">{displayName}</p>
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 mt-1">
                                    ผู้ดูแลระบบ
                                </Badge>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{adminUser?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    สร้างเมื่อ{" "}
                                    {adminUser?.createdAt
                                        ? formatDateTime(adminUser.createdAt)
                                        : "-"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                <span>สิทธิ์เข้าถึงทั้งระบบ</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Info */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-700" />
                            ข้อมูลระบบ
                        </CardTitle>
                        <CardDescription>สถิติและข้อมูลทั่วไปของระบบ ScholarSci</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-amber-100 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/20 p-4 text-center">
                                <p className="text-3xl font-bold text-amber-700">{totalAdmins}</p>
                                <p className="text-sm text-muted-foreground mt-1">ผู้ดูแลระบบทั้งหมด</p>
                            </div>
                            <div className="rounded-lg border border-amber-100 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/20 p-4 text-center">
                                <p className="text-3xl font-bold text-amber-700">{totalStudents}</p>
                                <p className="text-sm text-muted-foreground mt-1">นิสิตทุนทั้งหมด</p>
                            </div>
                            <div className="rounded-lg border p-4 col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">เวอร์ชันระบบ</p>
                                <p className="text-sm font-medium">ScholarSci v1.0 · Next.js 15 · Prisma 6</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Admin List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-amber-700" />
                                รายชื่อผู้ดูแลระบบ ({totalAdmins})
                            </CardTitle>
                            <CardDescription>จัดการบัญชีผู้ดูแลระบบทั้งหมด</CardDescription>
                        </div>
                        <CreateAdminForm />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50 dark:bg-gray-700">
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">อีเมล</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground">วันที่สร้าง</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminList.map((admin) => (
                                    <tr key={admin.id} className="border-b last:border-0 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                                        <td className="py-3 px-4 font-medium">{admin.email}</td>
                                        <td className="py-3 px-4 text-xs text-muted-foreground">
                                            {formatDateTime(admin.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-amber-700" />
                        ประวัติกิจกรรมระบบ (Audit Log)
                    </CardTitle>
                    <CardDescription>
                        บันทึกการดำเนินงานล่าสุด 50 รายการของผู้ดูแลระบบ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>ยังไม่มีประวัติกิจกรรมในระบบ</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-amber-50/40 dark:bg-amber-900/20">
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground whitespace-nowrap">
                                            วันที่/เวลา
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground whitespace-nowrap">
                                            ผู้ดำเนินการ
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground whitespace-nowrap">
                                            การดำเนินการ
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground whitespace-nowrap">
                                            ผู้ที่เกี่ยวข้อง
                                        </th>
                                        <th className="text-left py-3 px-3 font-medium text-muted-foreground whitespace-nowrap">
                                            รายละเอียด
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log) => {
                                        const actionInfo =
                                            AUDIT_ACTION_LABELS[log.action] || {
                                                label: log.action,
                                                color: "gray",
                                            };
                                        const detail = log.detailJson as Record<string, unknown> | null;
                                        const targetName =
                                            log.targetUser?.studentProfile?.fullName ||
                                            log.targetUser?.email ||
                                            "-";

                                        return (
                                            <tr
                                                key={log.id}
                                                className="border-b last:border-0 hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-colors"
                                            >
                                                <td className="py-3 px-3 text-muted-foreground whitespace-nowrap text-xs">
                                                    {formatDateTime(log.createdAt)}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span className="font-medium text-xs">
                                                        {log.actorAdmin.email}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <Badge
                                                        variant={actionInfo.color as never}
                                                        className="text-xs"
                                                    >
                                                        {actionInfo.label}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {targetName}
                                                </td>
                                                <td className="py-3 px-3 text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {detail?.reason
                                                        ? String(detail.reason)
                                                        : detail?.previousStatus
                                                        ? `สถานะเดิม: ${detail.previousStatus}`
                                                        : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
