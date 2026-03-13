"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";

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
    submissions: Submission[];
    studentName: string;
}

function SubmissionItem({ sub, studentName, label }: { sub: Submission; studentName: string; label?: string }) {
    return (
        <div className="space-y-1">
            {label && (
                <span className="text-[10px] text-muted-foreground">{label}</span>
            )}
            <div className="flex items-center gap-2 flex-wrap">
                <SubmissionReviewDialog
                    submission={sub}
                    studentName={studentName}
                />
            </div>
            {sub.message && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 pl-0.5">
                    {sub.message}
                </p>
            )}
            {sub.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-0.5">
                    {sub.attachments.map(att => (
                        <a
                            key={att.id}
                            href={att.fileUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md inline-flex items-center gap-1"
                        >
                            <FileText className="w-3 h-3" />
                            {att.fileName || "ไฟล์แนบ"}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

export function SubmissionList({ submissions, studentName }: Props) {
    const [showAll, setShowAll] = useState(false);
    const latest = submissions[0];
    const olderSubmissions = submissions.slice(1);

    return (
        <div className="ml-9 space-y-2">
            <SubmissionItem
                sub={latest}
                studentName={studentName}
                label={olderSubmissions.length > 0 ? "ล่าสุด" : undefined}
            />

            {olderSubmissions.length > 0 && (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? (
                            <><ChevronUp className="w-3 h-3 mr-0.5" /> ซ่อนงานเก่า</>
                        ) : (
                            <><ChevronDown className="w-3 h-3 mr-0.5" /> ดูงานเก่า ({olderSubmissions.length} รายการ)</>
                        )}
                    </Button>

                    {showAll && (
                        <div className="space-y-2 border-l-2 border-slate-100 dark:border-gray-700 pl-3">
                            {olderSubmissions.map((sub, idx) => (
                                <SubmissionItem
                                    key={sub.id}
                                    sub={sub}
                                    studentName={studentName}
                                    label={`ครั้งที่ ${olderSubmissions.length - idx}`}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
