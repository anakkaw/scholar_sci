import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout, NavItem } from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import {
    LayoutDashboard,
    User,
    Trophy,
    GraduationCap,
    FileText,
    FolderOpen,
    MessageSquare,
} from "lucide-react";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    if (session.user.role !== "STUDENT") {
        redirect("/admin/dashboard");
    }

    // Count unread messages from admin
    const unreadMessages = await prisma.message.count({
        where: {
            thread: { studentId: session.user.id },
            senderId: { not: session.user.id },
            isRead: false,
        },
    });

    const navItems: NavItem[] = [
        {
            title: "หน้าแรก (Dashboard)",
            href: "/dashboard",
            icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
            title: "ข้อมูลส่วนตัว",
            href: "/profile",
            icon: <User className="h-5 w-5" />,
        },
        {
            title: "ผลการเรียน",
            href: "/academic",
            icon: <GraduationCap className="h-5 w-5" />,
        },
        {
            title: "กิจกรรมและผลงาน",
            href: "/achievements",
            icon: <Trophy className="h-5 w-5" />,
        },
        {
            title: "รายงานโครงงาน",
            href: "/reports",
            icon: <FileText className="h-5 w-5" />,
        },
        {
            title: "คลังเอกสาร",
            href: "/documents",
            icon: <FolderOpen className="h-5 w-5" />,
        },
        {
            title: "ข้อความ",
            href: "/messages",
            icon: <MessageSquare className="h-5 w-5" />,
            badge: unreadMessages > 0 ? unreadMessages : undefined,
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
