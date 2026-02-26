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
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { reviewAchievementAction } from "@/actions/admin";

interface Props {
    achievementId: string;
    currentStatus: string;
}

export function AchievementReviewButtons({ achievementId, currentStatus }: Props) {
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<"VERIFIED" | "REJECTED" | null>(null);
    const [note, setNote] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const openDialog = (status: "VERIFIED" | "REJECTED") => {
        setPendingStatus(status);
        setNote("");
        setMessage(null);
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!pendingStatus) return;
        startTransition(async () => {
            const result = await reviewAchievementAction(achievementId, pendingStatus, note || undefined);
            if (result.success) {
                setMessage({ type: "success", text: result.success });
                setTimeout(() => setDialogOpen(false), 1000);
            } else {
                setMessage({ type: "error", text: result.error ?? "เกิดข้อผิดพลาด" });
            }
        });
    };

    if (currentStatus === "VERIFIED") {
        return null;
    }

    return (
        <>
            <div className="flex gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    onClick={() => openDialog("VERIFIED")}
                >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    ยืนยัน
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => openDialog("REJECTED")}
                >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    ปฏิเสธ
                </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {pendingStatus === "VERIFIED" ? "ยืนยันผลงาน" : "ปฏิเสธผลงาน"}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingStatus === "VERIFIED"
                                ? "ยืนยันว่าผลงานนี้ถูกต้องและผ่านการตรวจสอบ"
                                : "ปฏิเสธผลงานนี้พร้อมระบุเหตุผล"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="ระบุหมายเหตุหรือเหตุผล..."
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
                            className={pendingStatus === "VERIFIED"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {pendingStatus === "VERIFIED" ? "ยืนยัน" : "ปฏิเสธ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
