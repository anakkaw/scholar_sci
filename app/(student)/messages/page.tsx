import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MessagesPanel } from "@/components/student/messages-panel";
import { NewThreadDialog } from "@/components/student/new-thread-dialog";
import { MessageSquare } from "lucide-react";

export default async function MessagesPage({
    searchParams,
}: {
    searchParams: Promise<{ threadId?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { threadId } = await searchParams;

    // Fetch all threads for this student
    const threads = await prisma.messageThread.findMany({
        where: { studentId: session.user.id },
        orderBy: { lastMessageAt: "desc" },
        include: {
            messages: {
                select: { content: true, isRead: true, senderId: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    // Fetch selected thread's full messages
    let selectedThread = null;
    if (threadId) {
        const thread = await prisma.messageThread.findFirst({
            where: { id: threadId, studentId: session.user.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        sender: { select: { role: true } },
                    },
                },
            },
        });
        if (thread) selectedThread = thread;
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                        <MessageSquare className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">ข้อความ</h1>
                        <p className="text-sm text-muted-foreground">ติดต่อสื่อสารกับผู้ดูแลระบบ</p>
                    </div>
                </div>
                <NewThreadDialog />
            </div>

            {/* Messages Panel */}
            <MessagesPanel
                threads={threads}
                selectedThread={selectedThread}
                currentUserId={session.user.id}
            />
        </div>
    );
}
