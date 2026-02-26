"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { updateUserStatusAction } from "@/actions/admin";
import { USER_STATUS_LABELS } from "@/types/index";

interface Props {
    userId: string;
    currentStatus: string;
}

const COLOR_MAP: Record<string, string> = {
    yellow: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    green:  "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    red:    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    gray:   "bg-slate-50 text-slate-500 border-slate-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};

/**
 * For PENDING users: badge is clickable — one tap approves instantly via
 * optimistic UI (no spinner wait), server syncs in background.
 * For other statuses: plain static badge.
 */
export function QuickApproveButton({ userId, currentStatus }: Props) {
    const [isPending, startTransition] = useTransition();
    // Optimistic: switch to APPROVED immediately on click, revert if action fails
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

    const statusInfo = USER_STATUS_LABELS[optimisticStatus as keyof typeof USER_STATUS_LABELS]
        ?? { label: optimisticStatus, color: "gray" };

    const baseClasses = `inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border
        transition-colors ${COLOR_MAP[statusInfo.color] ?? COLOR_MAP.gray}`;

    // Non-PENDING → static badge
    if (optimisticStatus !== "PENDING") {
        return <span className={baseClasses}>{statusInfo.label}</span>;
    }

    return (
        <button
            disabled={isPending}
            title="คลิกเพื่ออนุมัติ"
            onClick={() =>
                startTransition(async () => {
                    setOptimisticStatus("APPROVED"); // ← instant visual change
                    const res = await updateUserStatusAction(userId, "APPROVED");
                    if (res.error) alert(res.error);
                    // on error: useOptimistic auto-reverts to currentStatus
                })
            }
            className={`${baseClasses} cursor-pointer
                hover:bg-green-50 hover:text-green-700 hover:border-green-300
                dark:hover:bg-green-900/30 dark:hover:text-green-300 dark:hover:border-green-600
                active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}
        >
            {statusInfo.label}
            <CheckCircle className="h-3 w-3 opacity-60" />
        </button>
    );
}
