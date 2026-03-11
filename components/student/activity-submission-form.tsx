"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, Loader2 } from "lucide-react";
import { submitActivityWorkAction } from "@/actions/activity-submission";
import { ActivitySubmissionSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";

interface Props {
    participationId: string;
    activityTitle: string;
    triggerLabel?: string;
}

export function ActivitySubmissionForm({ participationId, activityTitle, triggerLabel = "ส่งงาน" }: Props) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof ActivitySubmissionSchema>>({
        resolver: zodResolver(ActivitySubmissionSchema),
        defaultValues: { participationId, message: "", attachmentUrl: "", attachmentName: "" },
    });

    const handleUploadFile = useFileUpload("activities", form.setValue, {
        url: "attachmentUrl", name: "attachmentName", size: "attachmentSize", type: "attachmentType",
    });

    const onSubmit = (values: z.infer<typeof ActivitySubmissionSchema>) => {
        setError("");
        startTransition(async () => {
            const result = await submitActivityWorkAction(values);
            if (result.error) {
                setError(result.error);
            } else {
                form.reset({ participationId, message: "", attachmentUrl: "", attachmentName: "" });
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset({ participationId, message: "", attachmentUrl: "", attachmentName: "" }); setError(""); } }}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30">
                    <Send className="w-3 h-3 mr-1" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>ส่งงานกิจกรรม</DialogTitle>
                    <DialogDescription>{activityTitle}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
                        )}

                        <FormField control={form.control} name="message" render={({ field }) => (
                            <FormItem>
                                <FormLabel>ข้อความ / รายละเอียดงาน</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="อธิบายงานที่ส่ง หรือรายละเอียดเพิ่มเติม (ถ้ามี)"
                                        className="resize-none min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">แนบไฟล์หลักฐาน (ถ้ามี)</label>
                            <FileUpload
                                onUpload={handleUploadFile}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                                currentFileName={form.watch("attachmentName")}
                                currentFileUrl={form.watch("attachmentUrl")}
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-amber-700 hover:bg-amber-800">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? "กำลังส่ง..." : "ส่งงาน"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
