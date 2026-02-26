"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { createAcademicRecordAction } from "@/actions/academic";
import { AcademicRecordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentAcademicYear, getCurrentSemester, getAcademicYears, SEMESTERS } from "@/lib/utils";
import { FileUpload } from "@/components/shared/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";

const defaultValues = () => ({
    academicYear: getCurrentAcademicYear(),
    semester: getCurrentSemester(),
    gpa: 0,
    gpax: 0,
    transcriptUrl: "",
    transcriptName: "",
});

export function AcademicForm({ enrollmentYear }: { enrollmentYear?: number | null }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const academicYears = getAcademicYears(enrollmentYear);

    const form = useForm<z.infer<typeof AcademicRecordSchema>>({
        resolver: zodResolver(AcademicRecordSchema),
        defaultValues: defaultValues(),
    });

    const handleUploadFile = useFileUpload("transcripts", form.setValue, {
        url: "transcriptUrl", name: "transcriptName", size: "transcriptSize", type: "transcriptType",
    });

    const onSubmit = (values: z.infer<typeof AcademicRecordSchema>) => {
        setError("");
        startTransition(async () => {
            const result = await createAcademicRecordAction(values);
            if (result.error) {
                setError(result.error);
            } else {
                form.reset(defaultValues());
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(""); }}>
            <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    บันทึกผลการเรียน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>บันทึกผลการเรียน</DialogTitle>
                    <DialogDescription>กรอก GPA ภาคเรียนนี้, GPAX สะสม และแนบ Transcript</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
                        )}

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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="gpa" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>GPA ภาคเรียนนี้ <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" max="4" placeholder="เช่น 3.25" disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="gpax" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>GPAX สะสม <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" max="4" placeholder="เช่น 3.40" disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">แนบ Transcript (PDF)</label>
                            <FileUpload onUpload={handleUploadFile} disabled={isPending} accept=".pdf,.jpg,.jpeg,.png"
                                currentFileName={form.watch("transcriptName")} currentFileUrl={form.watch("transcriptUrl")} />
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>ยกเลิก</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? "กำลังบันทึก..." : "บันทึกผลการเรียน"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
