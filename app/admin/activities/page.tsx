import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteMandatoryActivityAction } from "@/actions/admin";
import { MandatoryActivityForm } from "./MandatoryActivityForm";

export default async function AdminActivitiesPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

    const [activities, scholarships] = await Promise.all([
        prisma.mandatoryActivity.findMany({
            include: {
                scholarship: { select: { name: true } },
                participations: { select: { attended: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.scholarship.findMany({
            where: { active: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">กิจกรรมบังคับ</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        กำหนดกิจกรรมที่ทุนกำหนดให้นิสิตเข้าร่วม และติดตามสถานะการเข้าร่วม
                    </p>
                </div>
                <MandatoryActivityForm scholarships={scholarships} />
            </div>

            {/* Activity List */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                        <div>
                            <CardTitle className="text-sm font-semibold">รายการกิจกรรมทั้งหมด</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{activities.length} กิจกรรม</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center py-14 gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                                <CalendarCheck className="w-8 h-8 text-amber-200" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500">ยังไม่มีกิจกรรมบังคับ</p>
                                <p className="text-xs text-muted-foreground mt-0.5">คลิก "สร้างกิจกรรมบังคับ" เพื่อเพิ่มกิจกรรม</p>
                            </div>
                        </div>
                    ) : activities.map(activity => {
                        const total = activity.participations.length;
                        const attended = activity.participations.filter(p => p.attended).length;
                        return (
                            <div key={activity.id} className="relative rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500" />
                                <div className="pl-5 pr-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-slate-800">{activity.title}</h4>
                                            {activity.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                {activity.date && (
                                                    <span className="text-muted-foreground">📅 {formatDate(activity.date)}</span>
                                                )}
                                                <Badge variant="outline" className="text-[10px]">
                                                    {activity.scholarship?.name ?? "ทุกทุน"}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {activity.yearLevel ? `ปีที่ ${activity.yearLevel}` : "ทุกชั้นปี"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="w-3 h-3" />
                                                    <span className="font-semibold text-slate-700">{attended}/{total}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">เข้าร่วม</p>
                                            </div>
                                            <form action={async () => {
                                                "use server";
                                                await deleteMandatoryActivityAction(activity.id);
                                            }}>
                                                <Button type="submit" variant="ghost" size="icon"
                                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                    <Trash className="w-3.5 h-3.5" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
