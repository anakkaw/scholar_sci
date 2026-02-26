"use client";

import { useOptimistic, useState, useTransition } from "react";
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
import { CheckCircle, XCircle } from "lucide-react";
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
    const [errorMsg, setErrorMsg] = useState("");
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

    const openDialog = (status: "VERIFIED" | "REJECTED") => {
        setPendingStatus(status);
        setNote("");
        setErrorMsg("");
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!pendingStatus) return;
        const chosen = pendingStatus;
        setDialogOpen(false); // close immediately — optimistic
        startTransition(async () => {
            setOptimisticStatus(chosen);
            const result = await reviewAchievementAction(achievementId, chosen, note || undefined);
            if (result.error) {
                setErrorMsg(result.error);
                setDialogOpen(true); // reopen with error
            }
        });
    };

    if (optimisticStatus === "VERIFIED") return null;

    return (
        <>
            <div className="flex gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className="text-green-600 border-green-200 dark:border-green-800/40 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-700"
                    onClick={() => openDialog("VERIFIED")}
                >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    ยืนยัน
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
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
                        {errorMsg && (
                            <p className="text-sm text-red-600">{errorMsg}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button
                            onClick={handleConfirm}
                            className={pendingStatus === "VERIFIED"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"}
                        >
                            {pendingStatus === "VERIFIED" ? "ยืนยัน" : "ปฏิเสธ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
