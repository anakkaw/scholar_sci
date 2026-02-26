"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { updateAttendanceAction } from "@/actions/admin";
import { cn } from "@/lib/utils";

interface Props {
    participationId: string;
    userId: string;
    attended: boolean;
}

export function AttendanceToggleButton({ participationId, userId, attended }: Props) {
    const [isPending, startTransition] = useTransition();
    const [optimisticAttended, setOptimisticAttended] = useOptimistic(attended);

    const toggle = () =>
        startTransition(async () => {
            setOptimisticAttended(!attended);
            await updateAttendanceAction(participationId, !attended, userId);
        });

    return (
        <button
            onClick={toggle}
            disabled={isPending}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all border",
                optimisticAttended
                    ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/40 hover:bg-green-100 dark:hover:bg-green-900/50"
                    : "bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-200",
                isPending && "opacity-60 cursor-not-allowed"
            )}
        >
            {optimisticAttended
                ? <CheckCircle2 className="w-3 h-3" />
                : <Clock className="w-3 h-3" />
            }
            {optimisticAttended ? "เข้าร่วมแล้ว" : "ยังไม่ได้เข้าร่วม"}
        </button>
    );
}
