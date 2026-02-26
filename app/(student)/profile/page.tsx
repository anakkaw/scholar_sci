import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/student/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: { scholarship: true },
    });

    if (!userProfile) redirect("/select-scholarship");

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-3xl mx-auto">

            {/* Page Header */}
            <div>
                <p className="text-[11px] font-semibold tracking-widest text-amber-500/70 uppercase mb-1">บัญชีผู้ใช้</p>
                <h2 className="text-2xl font-bold tracking-tight">ข้อมูลส่วนตัว</h2>
                <p className="text-sm text-muted-foreground mt-0.5">ปรับปรุงข้อมูลให้เป็นปัจจุบันเพื่อการติดต่อและรับข่าวสาร</p>
            </div>

            {/* Scholarship context strip */}
            {userProfile.scholarship && (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-900 truncate">{userProfile.fullName}</p>
                        <p className="text-xs text-amber-600/70 truncate">{userProfile.scholarship.name}</p>
                    </div>
                </div>
            )}

            {/* Form Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                        <div>
                            <CardTitle className="text-sm font-semibold">แก้ไขข้อมูลส่วนตัว</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                ข้อมูลที่กรอกจะถูกใช้โดยเจ้าหน้าที่ในการติดต่อ
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <Separator className="bg-slate-100" />
                <CardContent className="pt-6">
                    <ProfileForm userProfile={userProfile} />
                </CardContent>
            </Card>
        </div>
    );
}
