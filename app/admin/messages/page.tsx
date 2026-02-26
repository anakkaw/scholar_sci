import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminMessagesPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/dashboard");

    const { filter = "all" } = await searchParams;

    const threads = await prisma.messageThread.findMany({
        orderBy: { lastMessageAt: "desc" },
        include: {
            student: {
                select: {
                    id: true,
                    email: true,
                    studentProfile: { select: { fullName: true } },
                },
            },
            messages: {
                select: { isRead: true, senderId: true, content: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            _count: {
                select: {
                    messages: {
                        where: { isRead: false, sender: { role: "STUDENT" } },
                    },
                },
            },
        },
    });

    const filtered = threads.filter((t) => {
        if (filter === "unread") return t._count.messages > 0;
        if (filter === "open") return t.status === "OPEN";
        if (filter === "closed") return t.status === "CLOSED";
        return true;
    });

    const totalUnread = threads.reduce((acc, t) => acc + t._count.messages, 0);

    const filterTabs = [
        { key: "all", label: "ทั้งหมด", count: threads.length },
        { key: "unread", label: "ยังไม่อ่าน", count: totalUnread },
        { key: "open", label: "เปิดอยู่", count: threads.filter((t) => t.status === "OPEN").length },
        { key: "closed", label: "ปิดแล้ว", count: threads.filter((t) => t.status === "CLOSED").length },
    ];

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground">ข้อความนิสิต</h1>
                    <p className="text-sm text-muted-foreground">
                        {totalUnread > 0 ? `มีข้อความที่ยังไม่อ่าน ${totalUnread} ข้อความ` : "ไม่มีข้อความที่ยังไม่อ่าน"}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
                {filterTabs.map((tab) => (
                    <Link
                        key={tab.key}
                        href={`/admin/messages?filter=${tab.key}`}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                            filter === tab.key
                                ? "bg-white dark:bg-gray-700 text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={cn(
                                "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                                filter === tab.key
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                    : "bg-muted text-muted-foreground",
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Thread List */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground">ไม่มีข้อความในหมวดนี้</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {filtered.map((thread) => {
                            const studentName = thread.student.studentProfile?.fullName || thread.student.email;
                            const lastMsg = thread.messages[0];
                            const hasUnread = thread._count.messages > 0;
                            return (
                                <Link
                                    key={thread.id}
                                    href={`/admin/messages/${thread.id}`}
                                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-amber-50/50"
                                >
                                    {/* Unread dot */}
                                    <div className={cn("h-2 w-2 flex-shrink-0 rounded-full", hasUnread ? "bg-amber-500" : "bg-transparent")} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn("text-sm truncate", hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                                                {thread.subject}
                                            </p>
                                            {thread.status === "CLOSED" && (
                                                <Lock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                            {studentName}
                                            {lastMsg && ` · ${lastMsg.content}`}
                                        </p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                                        <p className="text-xs text-muted-foreground">
                                            {formatDateTime(thread.lastMessageAt)}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {hasUnread && (
                                                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                                                    {thread._count.messages}
                                                </span>
                                            )}
                                            <Badge
                                                variant={thread.status === "OPEN" ? "outline" : "secondary"}
                                                className="rounded-full text-[10px] px-1.5 py-0"
                                            >
                                                {thread.status === "OPEN" ? "เปิด" : "ปิด"}
                                            </Badge>
                                        </div>
                                    </div>

                                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
