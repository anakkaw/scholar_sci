"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { createAchievementAction } from "@/actions/achievement";
import { AchievementSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACHIEVEMENT_TYPES } from "@/types/index";
import { FileUpload } from "@/components/shared/FileUpload";
import { useFileUpload } from "@/hooks/useFileUpload";

export function AchievementForm() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof AchievementSchema>>({
        resolver: zodResolver(AchievementSchema),
        defaultValues: { title: "", description: "", date: "", coAuthors: "", referenceUrl: "", attachmentUrl: "", attachmentName: "" },
    });

    const handleUploadFile = useFileUpload("achievements", form.setValue, {
        url: "attachmentUrl", name: "attachmentName", size: "attachmentSize", type: "attachmentType",
    });

    const onSubmit = (values: z.infer<typeof AchievementSchema>) => {
        setError("");
        startTransition(async () => {
            const result = await createAchievementAction(values);
            if (result.error) {
                setError(result.error);
            } else {
                form.reset();
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(""); }}>
            <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    เพิ่มผลงาน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>เพิ่มผลงาน</DialogTitle>
                    <DialogDescription>บันทึกผลงานทางวิชาการ รางวัล และกิจกรรมต่าง ๆ เพื่อรวบรวมเป็น Portfolio ส่วนตัว</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
                        )}

                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                <FormLabel>ประเภทกิจกรรม/ผลงาน <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="เลือกประเภทผลงาน" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {ACHIEVEMENT_TYPES.filter(t => t.value !== "ACTIVITY").map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>ชื่อกิจกรรม / ผลงาน <span className="text-red-500">*</span></FormLabel>
                                <FormControl><Input placeholder="เช่น เข้าร่วมโครงการวิจัย, บทความวิชาการ..." disabled={isPending} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>รายละเอียดสังเขป</FormLabel>
                                <FormControl><Textarea placeholder="อธิบายเกี่ยวกับผลงาน..." disabled={isPending} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>วันที่ตีพิมพ์/ได้รับรางวัล</FormLabel>
                                    <FormControl><Input type="date" disabled={isPending} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="coAuthors" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ผู้ร่วมงาน/ผู้แต่งร่วม</FormLabel>
                                    <FormControl><Input placeholder="เช่น นาย ก, นางสาว ข" disabled={isPending} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="referenceUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>ลิงก์อ้างอิง URL (ถ้ามี)</FormLabel>
                                <FormControl><Input type="url" placeholder="https://..." disabled={isPending} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">แนบไฟล์หลักฐานประกอบ (ถ้ามี)</label>
                            <FileUpload onUpload={handleUploadFile} disabled={isPending}
                                currentFileName={form.watch("attachmentName")} currentFileUrl={form.watch("attachmentUrl")} />
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>ยกเลิก</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? "กำลังบันทึก..." : "บันทึก"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
