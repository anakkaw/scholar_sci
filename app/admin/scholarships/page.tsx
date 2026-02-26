import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const getScholarships = unstable_cache(
    () => prisma.scholarship.findMany({
        include: { _count: { select: { studentProfiles: true, milestones: true } } },
        orderBy: { createdAt: 'desc' },
    }),
    ["scholarships-list"],
    { tags: ["scholarships"], revalidate: 3600 }
);

export default async function AdminScholarshipsPage() {
    const scholarships = await getScholarships();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 mb-4">
                <h2 className="text-3xl font-bold tracking-tight">จัดการทุนการศึกษา</h2>
                <Button className="bg-amber-700 hover:bg-amber-800" asChild>
                    <Link href="/admin/scholarships/new">
                        <Plus className="mr-2 h-4 w-4" /> สร้างทุนใหม่
                    </Link>
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        โครงการทุนทั้งหมด
                    </CardTitle>
                    <CardDescription>
                        จัดการรายละเอียดทุน เงื่อนไข และสถานะการเปิดรับสมัคร
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>ชื่อทุนการศึกษา</TableHead>
                                    <TableHead>จำนวน Milestone</TableHead>
                                    <TableHead>นิสิตในโครงการ</TableHead>
                                    <TableHead className="text-right">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scholarships.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            ยังไม่มีโครงการทุนในระบบ
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    scholarships.map(scholarship => (
                                        <TableRow key={scholarship.id}>
                                            <TableCell className="font-medium max-w-[250px] truncate" title={scholarship.name}>
                                                {scholarship.name}
                                                {scholarship.description && (
                                                    <p className="text-xs text-muted-foreground font-normal truncate mt-1">
                                                        {scholarship.description}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">
                                                    {scholarship._count.milestones} milestone
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {scholarship._count.studentProfiles} คน
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/scholarships/${scholarship.id}`}>
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">แก้ไข</span>
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
