import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatShortDate } from "@/lib/utils";
import { UserStatusDropdown } from "./UserStatusDropdown";
import { QuickApproveButton } from "./QuickApproveButton";
import { UserSearchInput } from "./UserSearchInput";
import { ScholarshipFilterSelect } from "./ScholarshipFilterSelect";
import { Suspense } from "react";
import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { InlineEditText } from "./InlineEditText";
import { InlineEditDegreeLevel } from "./InlineEditDegreeLevel";
import { AdminVerifyEmailButton } from "./AdminVerifyEmailButton";
import { DeleteUserButton } from "./DeleteUserButton";
import { SortableHeader } from "./SortableHeader";

const STATUS_FILTERS = [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "รออนุมัติ", value: "PENDING" },
    { label: "อนุมัติแล้ว", value: "APPROVED" },
    { label: "ระงับ", value: "SUSPENDED" },
];

export default async function AdminUsersPage(
    props: { searchParams?: Promise<{ q?: string; status?: string; pending?: string; scholarship?: string; sort?: string; dir?: string }> }
) {
    const searchParams = await props.searchParams;
    const session = await getSession();
    if (!session?.user?.id) redirect("/login");

    const query = searchParams?.q || "";
    const statusFilter = searchParams?.status || "ALL";
    const pendingFilter = searchParams?.pending || "";
    const scholarshipFilter = searchParams?.scholarship || "";
    const sortField = searchParams?.sort || "";
    const sortDir = (searchParams?.dir === "desc" ? "desc" : "asc") as "asc" | "desc";

    // Build where clause
    const where: Prisma.UserWhereInput = {
        role: "STUDENT",
        ...(statusFilter !== "ALL" && { status: statusFilter as Prisma.EnumUserStatusFilter }),
        ...(scholarshipFilter && { studentProfile: { scholarshipId: scholarshipFilter } }),
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

    const [users, totalByStatus, scholarships] = await Promise.all([
        prisma.user.findMany({
            where,
            include: { studentProfile: { include: { scholarship: { select: { id: true, name: true } } } } },
            orderBy: sortField === "studentIdCode"
                ? { studentProfile: { studentIdCode: sortDir } }
                : sortField === "fullName"
                    ? { studentProfile: { fullName: sortDir } }
                    : { createdAt: 'desc' },
        }),
        prisma.user.groupBy({
            by: ["status"],
            where: { role: "STUDENT" },
            _count: { id: true },
        }),
        prisma.scholarship.findMany({
            where: { active: true },
            select: { id: true, name: true, _count: { select: { studentProfiles: true } } },
            orderBy: { name: "asc" },
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
                    <Link
                        href={`/admin/users${scholarshipFilter ? `?scholarship=${scholarshipFilter}` : ""}`}
                        className="text-xs text-amber-600 hover:text-amber-800 underline ml-auto"
                    >
                        ล้างตัวกรอง
                    </Link>
                </div>
            )}

            {/* Status filter pills */}
            <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map(f => {
                    const cnt = f.value === "ALL" ? totalAll : (countByStatus[f.value] ?? 0);
                    const isActive = statusFilter === f.value;
                    const pillParams = new URLSearchParams();
                    pillParams.set("status", f.value);
                    if (query) pillParams.set("q", query);
                    if (scholarshipFilter) pillParams.set("scholarship", scholarshipFilter);
                    return (
                        <Link key={f.value} href={`/admin/users?${pillParams.toString()}`}>
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
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <Suspense>
                                <ScholarshipFilterSelect
                                    scholarships={scholarships}
                                    currentScholarshipId={scholarshipFilter}
                                />
                            </Suspense>
                            <div className="flex-1 min-w-[180px]">
                                <Suspense>
                                    <UserSearchInput defaultValue={query} />
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 dark:bg-gray-800/80 border-b border-slate-100 dark:border-gray-700">
                                    <TableHead className="pl-5">
                                        <Suspense><SortableHeader label="รหัสนิสิต" sortKey="studentIdCode" /></Suspense>
                                    </TableHead>
                                    <TableHead>
                                        <Suspense><SortableHeader label="ชื่อ-นามสกุล" sortKey="fullName" /></Suspense>
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">อีเมล</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">ทุนการศึกษา</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">ระดับ</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">วันที่สมัคร</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400">สถานะ</TableHead>
                                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-gray-400 text-right pr-5">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8}>
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
                                    return (
                                        <TableRow key={user.id} className="border-b border-slate-50 dark:border-gray-700 hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-colors">
                                            <TableCell className="pl-5">
                                                <InlineEditText
                                                    userId={user.id}
                                                    field="studentIdCode"
                                                    currentValue={profile?.studentIdCode ?? null}
                                                    placeholder="รหัสนิสิต"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-amber-100 dark:border-amber-800/40 flex-shrink-0 shadow-sm">
                                                        <AvatarImage
                                                            src={profile?.profileImageUrl || user.image || ""}
                                                            alt={profile?.fullName || user.email || ""}
                                                        />
                                                        <AvatarFallback className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-bold">
                                                            {(profile?.fullName || user.email || "U").charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <InlineEditText
                                                            userId={user.id}
                                                            field="fullName"
                                                            currentValue={profile?.fullName ?? null}
                                                            placeholder="ชื่อ-นามสกุล"
                                                        />
                                                        {profile?.nickname && (
                                                            <p className="text-[11px] text-muted-foreground truncate">({profile.nickname})</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <span>{user.email}</span>
                                                {!user.emailVerified && (
                                                    <span className="ml-1.5 inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
                                                        ยังไม่ยืนยัน
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[180px]">
                                                <span className="text-xs text-slate-600 dark:text-gray-300 truncate block" title={profile?.scholarship?.name}>
                                                    {profile?.scholarship?.name || <span className="text-slate-300 dark:text-gray-600">ไม่ระบุ</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <InlineEditDegreeLevel
                                                    userId={user.id}
                                                    currentDegreeLevel={profile?.degreeLevel ?? null}
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatShortDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {/* PENDING badge is clickable → approve in one tap */}
                                                <QuickApproveButton userId={user.id} currentStatus={user.status} />
                                            </TableCell>
                                            <TableCell className="text-right pr-5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <AdminVerifyEmailButton userId={user.id} emailVerified={!!user.emailVerified} />
                                                    <Button variant="ghost" size="sm" asChild
                                                        className="h-7 w-7 p-0 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700">
                                                        <Link href={`/admin/users/${user.id}`}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                            <span className="sr-only">ดูรายละเอียด</span>
                                                        </Link>
                                                    </Button>
                                                    <UserStatusDropdown userId={user.id} currentStatus={user.status} />
                                                    <DeleteUserButton userId={user.id} email={user.email} />
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
