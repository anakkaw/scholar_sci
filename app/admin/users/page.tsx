import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/utils";
import { USER_STATUS_LABELS } from "@/types/index";
import { UserStatusDropdown } from "./UserStatusDropdown";
import { UserSearchInput } from "./UserSearchInput";
import { Suspense } from "react";
import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const STATUS_FILTERS = [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "รออนุมัติ", value: "PENDING" },
    { label: "อนุมัติแล้ว", value: "APPROVED" },
    { label: "ระงับ", value: "SUSPENDED" },
];

export default async function AdminUsersPage(
    props: { searchParams?: Promise<{ q?: string; status?: string; pending?: string }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session?.user?.id) redirect("/login");

    const query = searchParams?.q || "";
    const statusFilter = searchParams?.status || "ALL";
    const pendingFilter = searchParams?.pending || "";

    // Build where clause
    const where: Prisma.UserWhereInput = {
        role: "STUDENT",
        ...(statusFilter !== "ALL" && { status: statusFilter as Prisma.EnumUserStatusFilter }),
        ...(query && {
            OR: [
                { email: { contains: query, mode: "insensitive" as const } },
                { studentProfile: { fullName: { contains: query, mode: "insensitive" as const } } },
                { studentProfile: { studentIdCode: { contains: query, mode: "insensitive" as const } } },
            ]
        }),
        ...(pendingFilter === "gpa" && { academicRecords: { some: { status: "PENDING" as const } } }),
        ...(pendingFilter === "achievements" && { achievements: { some: { verificationStatus: "PENDING" as const, type: { not: "ACTIVITY" as const } } } }),
        ...(pendingFilter === "reports" && { progressReports: { some: { status: "SUBMITTED" as const } } }),
    };

    const [users, totalByStatus] = await Promise.all([
        prisma.user.findMany({
            where,
            include: { studentProfile: { include: { scholarship: { select: { id: true, name: true } } } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.groupBy({
            by: ["status"],
            where: { role: "STUDENT" },
            _count: { id: true },
        }),
    ]);

    const countByStatus = Object.fromEntries(totalByStatus.map(r => [r.status, r._count.id]));
    const totalAll = Object.values(countByStatus).reduce((a, b) => a + b, 0);

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">

            {/* Page Header */}
            <div>
                <p className="text-[11px] font-semibold tracking-widest text-amber-500/70 uppercase mb-1">Admin</p>
                <h2 className="text-2xl font-bold tracking-tight">จัดการผู้ใช้งาน</h2>
                <p className="text-sm text-muted-foreground mt-0.5">ตรวจสอบและอนุมัติสิทธิ์การเข้าใช้งานของนิสิต</p>
            </div>

            {/* Pending filter banner */}
            {pendingFilter && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <span className="text-sm text-amber-800">
                        กรองเฉพาะนิสิตที่มี{pendingFilter === "gpa" ? " GPA รอตรวจสอบ" : pendingFilter === "achievements" ? "ผลงานรอตรวจสอบ" : "รายงานรอตรวจสอบ"}
                        {" "}— {users.length} คน
                    </span>
                    <Link href="/admin/users" className="text-xs text-amber-600 hover:text-amber-800 underline ml-auto">
                        ล้างตัวกรอง
                    </Link>
                </div>
            )}

            {/* Status filter pills */}
            <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map(f => {
                    const cnt = f.value === "ALL" ? totalAll : (countByStatus[f.value] ?? 0);
                    const isActive = statusFilter === f.value;
                    return (
                        <Link key={f.value} href={`/admin/users?status=${f.value}${query ? `&q=${query}` : ""}`}>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border
                                ${isActive
                                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                    : "bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-amber-300 hover:text-amber-700"
                                }`}>
                                {f.label}
                                <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold
                                    ${isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400"}`}>
                                    {cnt}
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                            <div>
                                <CardTitle className="text-sm font-semibold">รายชื่อนิสิตทุนในระบบ</CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    แสดง {users.length} รายการ
                                </CardDescription>
                            </div>
                        </div>
                        <div className="max-w-xs w-full">
                            <Suspense>
                                <UserSearchInput defaultValue={query} />
                            </Suspense>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 dark:bg-gray-800/80 border-b border-slate-100 dark:border-gray-700">
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400 pl-5">รหัสนิสิต</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">ชื่อ-นามสกุล</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">อีเมล</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">ทุนการศึกษา</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">วันที่สมัคร</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">สถานะ</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400 text-right pr-5">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <div className="flex flex-col items-center py-12 gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-gray-700 flex items-center justify-center">
                                                    <Users className="w-6 h-6 text-slate-300 dark:text-gray-600" />
                                                </div>
                                                <p className="text-sm text-muted-foreground">ไม่พบข้อมูลผู้ใช้งาน</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.map(user => {
                                    const profile = user.studentProfile;
                                    const statusInfo = USER_STATUS_LABELS[user.status] || { label: user.status, color: "gray" };
                                    return (
                                        <TableRow key={user.id} className="border-b border-slate-50 dark:border-gray-700 hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-colors">
                                            <TableCell className="text-xs font-medium text-slate-600 dark:text-gray-300 pl-5">
                                                {profile?.studentIdCode || <span className="text-slate-300 dark:text-gray-600">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="h-8 w-8 border border-amber-100 flex-shrink-0">
                                                        <AvatarImage
                                                            src={user.image || profile?.profileImageUrl || ""}
                                                            alt={profile?.fullName || user.email || ""}
                                                        />
                                                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
                                                            {(profile?.fullName || user.email || "U").charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-gray-200">
                                                        {profile?.fullName || <span className="text-slate-400 dark:text-gray-500">ยังไม่ระบุ</span>}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                                            <TableCell className="max-w-[180px]">
                                                <span className="text-xs text-slate-600 dark:text-gray-300 truncate block" title={profile?.scholarship?.name}>
                                                    {profile?.scholarship?.name || <span className="text-slate-300 dark:text-gray-600">ไม่ระบุ</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatShortDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusInfo.color as any} className="text-[10px]">
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" asChild
                                                        className="h-7 w-7 p-0 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700">
                                                        <Link href={`/admin/users/${user.id}`}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                            <span className="sr-only">ดูรายละเอียด</span>
                                                        </Link>
                                                    </Button>
                                                    <UserStatusDropdown userId={user.id} currentStatus={user.status} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
