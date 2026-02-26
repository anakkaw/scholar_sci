import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout, NavItem } from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FolderKanban,
    Settings,
    CalendarCheck,
    MessageSquare,
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

    // Count unread messages from students
    const unreadMessages = await prisma.message.count({
        where: {
            isRead: false,
            sender: { role: "STUDENT" },
        },
    });

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
            title: "ข้อความนิสิต",
            href: "/admin/messages",
            icon: <MessageSquare className="h-5 w-5" />,
            badge: unreadMessages > 0 ? unreadMessages : undefined,
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
