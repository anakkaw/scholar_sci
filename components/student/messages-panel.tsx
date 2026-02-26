"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDate } from "@/lib/utils";
import { replyToThreadAction, markThreadReadAction } from "@/actions/messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Lock, ArrowLeft } from "lucide-react";

type Message = {
    id: string;
    content: string;
    senderId: string;
    isRead: boolean;
    createdAt: Date;
    sender: { role: string };
};

type Thread = {
    id: string;
    subject: string;
    status: string;
    lastMessageAt: Date;
    messages: { content: string; isRead: boolean; senderId: string }[];
};

type SelectedThread = {
    id: string;
    subject: string;
    status: string;
    createdAt: Date;
    messages: Message[];
};

interface MessagesPanelProps {
    threads: Thread[];
    selectedThread: SelectedThread | null;
    currentUserId: string;
}

export function MessagesPanel({ threads, selectedThread, currentUserId }: MessagesPanelProps) {
    const router = useRouter();
    const [replyContent, setReplyContent] = useState("");
    const [replyError, setReplyError] = useState("");
    const [isPending, startTransition] = useTransition();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedThread?.messages.length]);

    // Mark messages as read when thread is opened
    useEffect(() => {
        if (selectedThread?.id) {
            markThreadReadAction(selectedThread.id);
        }
    }, [selectedThread?.id]);

    function handleSelectThread(threadId: string) {
        router.push(`/messages?threadId=${threadId}`);
    }

    function handleReply() {
        if (!replyContent.trim() || !selectedThread) return;
        setReplyError("");
        startTransition(async () => {
            const result = await replyToThreadAction({ threadId: selectedThread.id, content: replyContent.trim() });
            if (result?.error) {
                setReplyError(result.error);
            } else {
                setReplyContent("");
            }
        });
    }

    const unreadCount = (thread: Thread) =>
        thread.messages.filter((m) => m.senderId !== currentUserId && !m.isRead).length;

    return (
        <div className="flex h-[calc(100vh-10rem)] min-h-[500px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Thread List — full width on mobile (hidden when thread selected), fixed sidebar on sm+ */}
            <div className={cn(
                "flex flex-col border-r border-border",
                "w-full sm:w-72 sm:flex-shrink-0 lg:w-80",
                selectedThread ? "hidden sm:flex" : "flex",
            )}>
                <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">การสนทนา ({threads.length})</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">ยังไม่มีข้อความ</p>
                        </div>
                    ) : (
                        threads.map((thread) => {
                            const isActive = selectedThread?.id === thread.id;
                            const unread = unreadCount(thread);
                            const lastMsg = thread.messages[thread.messages.length - 1];
                            return (
                                <button
                                    key={thread.id}
                                    onClick={() => handleSelectThread(thread.id)}
                                    className={cn(
                                        "w-full border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-amber-50/60 dark:hover:bg-amber-900/20",
                                        isActive && "bg-amber-50 dark:bg-amber-900/30 border-l-2 border-l-amber-500",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn("line-clamp-1 text-sm", unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                                            {thread.subject}
                                        </p>
                                        <div className="flex flex-shrink-0 items-center gap-1">
                                            {unread > 0 && (
                                                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                                                    {unread}
                                                </span>
                                            )}
                                            {thread.status === "CLOSED" && (
                                                <Lock className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                    {lastMsg && (
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                            {lastMsg.content}
                                        </p>
                                    )}
                                    <p className="mt-1 text-[11px] text-muted-foreground/60">
                                        {formatDate(thread.lastMessageAt)}
                                    </p>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Conversation View — hidden on mobile when no thread selected */}
            <div className={cn(
                "flex flex-col overflow-hidden flex-1",
                selectedThread ? "flex" : "hidden sm:flex",
            )}>
                {selectedThread ? (
                    <>
                        {/* Thread Header */}
                        <div className="flex items-center justify-between border-b border-border px-4 py-3 gap-2">
                            {/* Back button — mobile only */}
                            <button
                                onClick={() => router.push("/messages")}
                                className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                                aria-label="กลับ"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{selectedThread.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                    เปิดเมื่อ {formatDate(selectedThread.createdAt)}
                                </p>
                            </div>
                            <Badge
                                variant={selectedThread.status === "OPEN" ? "default" : "secondary"}
                                className="rounded-full text-xs flex-shrink-0"
                            >
                                {selectedThread.status === "OPEN" ? "เปิดอยู่" : "ปิดแล้ว"}
                            </Badge>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {selectedThread.messages.map((msg) => {
                                const isOwn = msg.senderId === currentUserId;
                                const isAdmin = msg.sender.role === "ADMIN";
                                return (
                                    <div key={msg.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
                                        <Avatar className="h-8 w-8 flex-shrink-0 border-2 border-amber-100 dark:border-amber-900/50">
                                            <AvatarFallback className={cn("text-xs font-bold", isAdmin ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300")}>
                                                {isAdmin ? "A" : "S"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn("flex max-w-[70%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {isAdmin ? "ผู้ดูแลระบบ" : "ฉัน"}
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
                            <div ref={bottomRef} />
                        </div>

                        {/* Reply Box */}
                        {selectedThread.status === "OPEN" ? (
                            <div className="border-t border-border px-4 py-3">
                                {replyError && (
                                    <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">{replyError}</p>
                                )}
                                <div className="flex gap-2">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
                                        }}
                                        placeholder="พิมพ์ข้อความตอบกลับ... (Ctrl+Enter เพื่อส่ง)"
                                        rows={2}
                                        className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <Button
                                        onClick={handleReply}
                                        disabled={isPending || !replyContent.trim()}
                                        size="icon"
                                        className="h-auto self-end rounded-xl px-3 py-2"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-border px-5 py-3">
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                    สนทนานี้ถูกปิดแล้ว ไม่สามารถส่งข้อความเพิ่มเติมได้
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                        <div className="rounded-full bg-amber-50 dark:bg-amber-900/30 p-4">
                            <MessageSquare className="h-8 w-8 text-amber-400" />
                        </div>
                        <p className="font-medium text-foreground">เลือกการสนทนา</p>
                        <p className="text-sm text-muted-foreground">เลือกข้อความจากรายการทางซ้าย หรือเริ่มการสนทนาใหม่</p>
                    </div>
                )}
            </div>
        </div>
    );
}
