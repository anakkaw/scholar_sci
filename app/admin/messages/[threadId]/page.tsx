import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThreadActions } from "@/components/admin/thread-actions";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminThreadPage({
    params,
}: {
    params: Promise<{ threadId: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/dashboard");

    const { threadId } = await params;

    const thread = await prisma.messageThread.findUnique({
        where: { id: threadId },
        include: {
            student: {
                select: {
                    id: true,
                    email: true,
                    studentProfile: { select: { fullName: true, faculty: true, major: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    sender: { select: { role: true } },
                },
            },
        },
    });

    if (!thread) notFound();

    const studentName = thread.student.studentProfile?.fullName || thread.student.email;
    const adminId = session.user.id;

    return (
        <div className="flex flex-col gap-5">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <Link href="/admin/messages" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    กลับ
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* Thread Header */}
                <div className="border-b border-border bg-gradient-to-r from-amber-50/60 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-foreground truncate">{thread.subject}</h2>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span>จาก: <strong className="text-foreground">{studentName}</strong></span>
                                <span>·</span>
                                <span>{thread.student.email}</span>
                                {thread.student.studentProfile?.faculty && (
                                    <>
                                        <span>·</span>
                                        <span>{thread.student.studentProfile.faculty}</span>
                                    </>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                                เปิดเมื่อ {formatDate(thread.createdAt)} · {thread.messages.length} ข้อความ
                            </p>
                        </div>
                        <Badge
                            variant={thread.status === "OPEN" ? "default" : "secondary"}
                            className="flex-shrink-0 rounded-full"
                        >
                            {thread.status === "OPEN" ? "เปิดอยู่" : "ปิดแล้ว"}
                        </Badge>
                    </div>
                </div>

                {/* Messages */}
                <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                    {thread.messages.map((msg) => {
                        const isAdmin = msg.sender.role === "ADMIN";
                        const isOwn = msg.senderId === adminId;
                        return (
                            <div key={msg.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
                                <Avatar className="h-8 w-8 flex-shrink-0 border-2 border-amber-100 dark:border-amber-900/50">
                                    <AvatarFallback className={cn("text-xs font-bold", isAdmin ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300")}>
                                        {isAdmin ? "A" : (studentName?.charAt(0) || "S")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={cn("flex max-w-[70%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {isAdmin ? "ผู้ดูแลระบบ" : studentName}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground/60">
                                            {formatDateTime(msg.createdAt)}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                        isOwn
                                            ? "rounded-tr-sm bg-amber-500 text-white"
                                            : "rounded-tl-sm bg-muted text-foreground",
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reply / Close Actions */}
                <ThreadActions threadId={thread.id} isClosed={thread.status === "CLOSED"} />
            </div>
        </div>
    );
}
