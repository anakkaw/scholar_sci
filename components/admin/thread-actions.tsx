"use client";

import { useOptimistic, useState, useTransition, useRef, useEffect } from "react";
import { replyToThreadAction, closeThreadAction, markThreadReadAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Send, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadActionsProps {
    threadId: string;
    isClosed: boolean;
}

export function ThreadActions({ threadId, isClosed }: ThreadActionsProps) {
    const [replyContent, setReplyContent] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const [isClosing, startCloseTransition] = useTransition();
    const [optimisticClosed, setOptimisticClosed] = useOptimistic(isClosed);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Mark messages as read on mount
    useEffect(() => {
        markThreadReadAction(threadId);
        bottomRef.current?.scrollIntoView();
    }, [threadId]);

    function handleReply() {
        if (!replyContent.trim()) return;
        const content = replyContent.trim();
        setReplyContent(""); // clear instantly
        setError("");
        startTransition(async () => {
            const result = await replyToThreadAction({ threadId, content });
            if (result?.error) {
                setError(result.error);
                setReplyContent(content); // restore on error
            }
        });
    }

    function handleClose() {
        startCloseTransition(async () => {
            setOptimisticClosed(true); // instant close
            await closeThreadAction(threadId);
        });
    }

    if (optimisticClosed) {
        return (
            <div className="border-t border-border bg-muted/30 px-5 py-3">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    สนทนานี้ถูกปิดแล้ว ไม่สามารถส่งข้อความเพิ่มเติมได้
                </p>
            </div>
        );
    }

    return (
        <div className="border-t border-border px-5 py-4 space-y-3">
            {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-1.5 text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
                <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
                    }}
                    placeholder="พิมพ์ข้อความตอบกลับ... (Ctrl+Enter เพื่อส่ง)"
                    rows={3}
                    className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                    onClick={handleReply}
                    disabled={isPending || !replyContent.trim()}
                    className="h-auto self-end rounded-xl px-4 py-2.5 gap-2"
                >
                    <Send className="h-4 w-4" />
                    ส่ง
                </Button>
            </div>
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={isClosing}
                    className={cn("rounded-xl gap-2 text-muted-foreground hover:text-destructive hover:border-destructive")}
                >
                    <Lock className="h-3.5 w-3.5" />
                    ปิดสนทนา
                </Button>
            </div>
        </div>
    );
}
