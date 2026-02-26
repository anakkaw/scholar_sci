"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { createReportAction } from "@/actions/report";
import { ReportSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentAcademicYear, getCurrentSemester, getAcademicYears, SEMESTERS } from "@/lib/utils";
import { FileUpload } from "@/components/shared/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";

type ReportFormProps = {
    milestoneId?: string;
    milestoneTitle?: string;
    triggerLabel?: string;
};

export function ReportForm({ milestoneId, milestoneTitle, triggerLabel }: ReportFormProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const academicYears = getAcademicYears();

    const getDefaults = () => ({
        milestoneId: milestoneId || "",
        academicYear: getCurrentAcademicYear(),
        semester: getCurrentSemester(),
        summary: "",
        attachmentUrl: "",
        attachmentName: "",
    });

    const form = useForm<z.infer<typeof ReportSchema>>({
        resolver: zodResolver(ReportSchema),
        defaultValues: getDefaults(),
    });

    const handleUploadFile = useFileUpload("reports", form.setValue, {
        url: "attachmentUrl", name: "attachmentName", size: "attachmentSize", type: "attachmentType",
    });

    const onSubmit = (values: z.infer<typeof ReportSchema>) => {
        setError("");
        startTransition(async () => {
            const result = await createReportAction(values);
            if (result.error) {
                setError(result.error);
            } else {
                form.reset(getDefaults());
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(""); }}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-amber-700 hover:bg-amber-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {triggerLabel || "ส่งรายงานโครงงาน"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {milestoneTitle ? `ส่งรายงาน: ${milestoneTitle}` : "ส่งรายงานโครงงาน"}
                    </DialogTitle>
                    <DialogDescription>
                        {milestoneTitle
                            ? `กรอกรายละเอียดและแนบไฟล์รายงานสำหรับ "${milestoneTitle}"`
                            : "กรอกรายละเอียดและแนบไฟล์รายงานโครงงาน"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
                        )}

                        {!milestoneId && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="semester" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ภาคเรียน <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="เลือกภาคเรียน" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {SEMESTERS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="academicYear" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ปีการศึกษา (พ.ศ.) <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="เลือกปีการศึกษา" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {academicYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        )}

                        <FormField control={form.control} name="summary" render={({ field }) => (
                            <FormItem>
                                <FormLabel>สรุปความคืบหน้า / เนื้อหารายงาน <span className="text-red-500">*</span></FormLabel>
                                <FormControl><Textarea rows={5} placeholder="อธิบายรายละเอียดของรายงาน..." disabled={isPending} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">ไฟล์แนบรายงาน (PDF, Word)</label>
                            <FileUpload onUpload={handleUploadFile} disabled={isPending}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                                currentFileName={form.watch("attachmentName")} currentFileUrl={form.watch("attachmentUrl")} />
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>ยกเลิก</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? "กำลังบันทึก..." : "ส่งรายงาน"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
