import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABELS, REPORT_STATUS_LABELS } from "@/types";

type StatusType = "user" | "report" | "achievement" | "document";

interface StatusBadgeProps {
    status: string;
    type?: StatusType;
}

const achievementStatusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "gray" }> = {
    PENDING: { label: "รอตรวจสอบ", variant: "warning" },
    VERIFIED: { label: "ยืนยันแล้ว", variant: "success" },
    REJECTED: { label: "ไม่ผ่าน", variant: "destructive" },
};

export function StatusBadge({ status, type = "user" }: StatusBadgeProps) {
    if (type === "user") {
        const info = USER_STATUS_LABELS[status];
        if (!info) return <Badge variant="gray">{status}</Badge>;
        const variantMap: Record<string, "success" | "warning" | "destructive" | "gray"> = {
            PENDING: "warning",
            APPROVED: "success",
            REJECTED: "destructive",
            SUSPENDED: "gray",
        };
        return <Badge variant={variantMap[status] ?? "gray"}>{info.label}</Badge>;
    }

    if (type === "report") {
        const info = REPORT_STATUS_LABELS[status];
        if (!info) return <Badge variant="gray">{status}</Badge>;
        const variantMap: Record<string, "success" | "warning" | "destructive" | "gray" | "info"> = {
            DRAFT: "gray",
            SUBMITTED: "info",
            REVIEWED: "success",
            NEED_REVISION: "destructive",
        };
        return <Badge variant={(variantMap[status] as any) ?? "gray"}>{info.label}</Badge>;
    }

    if (type === "achievement") {
        const info = achievementStatusMap[status];
        if (!info) return <Badge variant="gray">{status}</Badge>;
        return <Badge variant={info.variant}>{info.label}</Badge>;
    }

    return <Badge variant="gray">{status}</Badge>;
}
