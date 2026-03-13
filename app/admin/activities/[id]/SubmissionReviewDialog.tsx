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
import { CheckCircle, XCircle, FileText, Eye, Clock } from "lucide-react";
import { reviewActivitySubmissionAction } from "@/actions/admin";

interface Attachment {
    id: string;
    fileUrl: string | null;
    fileName: string | null;
}

interface Submission {
    id: string;
    message: string | null;
    status: string;
    reviewNote: string | null;
    createdAt: Date;
    attachments: Attachment[];
}

interface Props {
    submission: Submission;
    studentName: string;
}

export function SubmissionReviewDialog({ submission, studentName }: Props) {
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<"VERIFIED" | "REJECTED" | null>(null);
    const [note, setNote] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(submission.status);

    const openReviewDialog = (status: "VERIFIED" | "REJECTED") => {
        setPendingStatus(status);
        setNote("");
        setErrorMsg("");
        setDialogOpen(true);
    };

    const handleConfirm = () => {
        if (!pendingStatus) return;
        const chosen = pendingStatus;
        setDialogOpen(false);
        startTransition(async () => {
            setOptimisticStatus(chosen);
            const result = await reviewActivitySubmissionAction(submission.id, chosen, note || undefined);
            if (result.error) {
                setErrorMsg(result.error);
                setDialogOpen(true);
            }
        });
    };

    const isReviewed = optimisticStatus === "VERIFIED" || optimisticStatus === "REJECTED";

    const statusBadge = optimisticStatus === "VERIFIED" ? (
        <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> งานผ่าน
        </span>
    ) : optimisticStatus === "REJECTED" ? (
        <span className="text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
            <XCircle className="w-3 h-3" /> ไม่ผ่าน
        </span>
    ) : (
        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> รอตรวจ
        </span>
    );

    return (
        <>
            <div className="flex items-center gap-1.5">
                {statusBadge}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => {
                        setPendingStatus(null);
                        setNote("");
                        setErrorMsg("");
                        setDialogOpen(true);
                    }}
                >
                    <Eye className="w-3 h-3 mr-1" /> {isReviewed ? "ดูงาน" : "ตรวจงาน"}
                </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isReviewed ? "รายละเอียดงาน" : "ตรวจงานกิจกรรม"}</DialogTitle>
                        <DialogDescription>งานจาก: {studentName}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* Submission message */}
                        {submission.message && (
                            <div>
                                <Label className="text-xs text-muted-foreground">ข้อความจากนิสิต</Label>
                                <div className="mt-1 text-sm bg-slate-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                                    {submission.message}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {submission.attachments.length > 0 && (
                            <div>
                                <Label className="text-xs text-muted-foreground">ไฟล์แนบ</Label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {submission.attachments.map(att => (
                                        <a
                                            key={att.id}
                                            href={att.fileUrl || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            {att.fileName || "ไฟล์แนบ"}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!submission.message && submission.attachments.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">ไม่มีข้อความหรือไฟล์แนบ</p>
                        )}

                        {/* Submitted date */}
                        <div className="text-[11px] text-muted-foreground">
                            ส่งเมื่อ: {new Date(submission.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                        </div>

                        {/* Show existing review note for already-reviewed submissions */}
                        {isReviewed && submission.reviewNote && !pendingStatus && (
                            <div>
                                <Label className="text-xs text-muted-foreground">หมายเหตุจากแอดมิน</Label>
                                <div className="mt-1 text-sm bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                                    {submission.reviewNote}
                                </div>
                            </div>
                        )}

                        {/* Review note input */}
                        {pendingStatus && (
                            <div>
                                <Label htmlFor="submission-note">หมายเหตุ (ไม่บังคับ)</Label>
                                <Textarea
                                    id="submission-note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="ระบุหมายเหตุหรือเหตุผล..."
                                    className="mt-1.5"
                                    rows={3}
                                />
                            </div>
                        )}

                        {errorMsg && (
                            <p className="text-sm text-red-600">{errorMsg}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        {!pendingStatus ? (
                            <>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>ปิด</Button>
                                {/* Allow re-reviewing even already-reviewed submissions */}
                                <Button
                                    variant="outline"
                                    disabled={isPending}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => openReviewDialog("REJECTED")}
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    ไม่ผ่าน
                                </Button>
                                <Button
                                    disabled={isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => openReviewDialog("VERIFIED")}
                                >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    อนุมัติ
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setPendingStatus(null)}>กลับ</Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={isPending}
                                    className={pendingStatus === "VERIFIED"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"}
                                >
                                    {pendingStatus === "VERIFIED" ? "ยืนยันอนุมัติ" : "ยืนยันปฏิเสธ"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
