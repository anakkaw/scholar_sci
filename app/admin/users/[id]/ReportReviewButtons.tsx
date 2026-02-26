"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { reviewReportAction } from "@/actions/admin";

interface Props {
    reportId: string;
    currentStatus: string;
}

export function ReportReviewButtons({ reportId, currentStatus }: Props) {
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<"REVIEWED" | "NEED_REVISION" | null>(null);
    const [note, setNote] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const openDialog = (status: "REVIEWED" | "NEED_REVISION") => {
        setPendingStatus(status);
        setNote("");
        setMessage(null);
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!pendingStatus) return;
        startTransition(async () => {
            const result = await reviewReportAction(reportId, pendingStatus, note || undefined);
            if (result.success) {
                setMessage({ type: "success", text: result.success });
                setTimeout(() => setDialogOpen(false), 1000);
            } else {
                setMessage({ type: "error", text: result.error ?? "เกิดข้อผิดพลาด" });
            }
        });
    };

    if (currentStatus === "REVIEWED") return null;

    return (
        <>
            <div className="flex gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 dark:border-green-800/40 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700"
                    onClick={() => openDialog("REVIEWED")}
                >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    ผ่าน
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-200 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700"
                    onClick={() => openDialog("NEED_REVISION")}
                >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    แก้ไข
                </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {pendingStatus === "REVIEWED" ? "ยืนยันรายงาน" : "ส่งกลับให้แก้ไข"}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingStatus === "REVIEWED"
                                ? "ยืนยันว่ารายงานนี้ผ่านการตรวจสอบ"
                                : "ส่งรายงานกลับให้นิสิตแก้ไขพร้อมข้อเสนอแนะ"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="report-note">ข้อเสนอแนะ (ไม่บังคับ)</Label>
                            <Textarea
                                id="report-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="ระบุข้อเสนอแนะหรือเหตุผล..."
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>
                        {message && (
                            <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button
                            disabled={isPending}
                            onClick={handleConfirm}
                            className={pendingStatus === "REVIEWED"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-amber-600 hover:bg-amber-700"}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {pendingStatus === "REVIEWED" ? "ยืนยัน" : "ส่งกลับ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
