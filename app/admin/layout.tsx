import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout, NavItem } from "@/components/layout/AppLayout";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FolderKanban,
    Settings,
    CalendarCheck,
} from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const navItems: NavItem[] = [
        {
            title: "แดชบอร์ดผู้ดูแลระบบ",
            href: "/admin/dashboard",
            icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
            title: "จัดการผู้ใช้งาน",
            href: "/admin/users",
            icon: <Users className="h-5 w-5" />,
        },
        {
            title: "ทุนการศึกษา",
            href: "/admin/scholarships",
            icon: <GraduationCap className="h-5 w-5" />,
        },
        {
            title: "กิจกรรมบังคับ",
            href: "/admin/activities",
            icon: <CalendarCheck className="h-5 w-5" />,
        },
        {
            title: "จัดการคลังเอกสาร",
            href: "/admin/documents",
            icon: <FolderKanban className="h-5 w-5" />,
        },
        {
            title: "ตั้งค่าระบบ",
            href: "/admin/settings",
            icon: <Settings className="h-5 w-5" />,
        },
    ];

    const userInfo = {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
    };

    return (
        <AppLayout navItems={navItems} user={userInfo}>
            {children}
        </AppLayout>
    );
}
