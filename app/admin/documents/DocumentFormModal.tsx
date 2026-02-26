"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DocumentSchema } from "@/lib/validations";
import { createDocumentAction } from "@/actions/document";
import { FileUpload } from "@/components/shared/FileUpload";

type DocumentFormValues = z.infer<typeof DocumentSchema>;

interface DocumentFormModalProps {
    scholarships: { id: string, name: string }[];
}

export function DocumentFormModal({ scholarships }: DocumentFormModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(DocumentSchema),
        defaultValues: {
            title: "",
            category: "คู่มือ",
            scholarshipScope: "ALL",
            scholarshipIds: [],
            fileUrl: "",
            fileName: "",
            fileSizeBytes: 0,
            mimeType: "",
            isPublished: true,
        },
    });

    const scope = form.watch("scholarshipScope");
    const selectedIds = form.watch("scholarshipIds") ?? [];

    const toggleScholarship = (id: string) => {
        const current = form.getValues("scholarshipIds") ?? [];
        form.setValue(
            "scholarshipIds",
            current.includes(id) ? current.filter(x => x !== id) : [...current, id],
            { shouldValidate: true }
        );
    };

    const onSubmit = (data: DocumentFormValues) => {
        startTransition(async () => {
            const res = await createDocumentAction(data);
            if (res.error) {
                alert(res.error);
            } else {
                setOpen(false);
                form.reset();
                router.refresh();
            }
        });
    };

    const handleUploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "documents");

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        form.setValue("fileUrl", data.url, { shouldValidate: true });
        form.setValue("fileName", data.originalName, { shouldValidate: true });
        form.setValue("fileSizeBytes", data.size, { shouldValidate: true });
        form.setValue("mimeType", data.mimeType, { shouldValidate: true });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                    <Plus className="mr-2 h-4 w-4" /> อัปโหลดเอกสารใหม่
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>อัปโหลดเอกสารใหม่เข้าระบบ</DialogTitle>
                    <DialogDescription>
                        เพิ่มระเบียบการ คู่มือ หรือแบบฟอร์มต่างๆ ให้นิสิตดาวน์โหลด
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ชื่อเอกสาร <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="เช่น คู่มือการเขียนรายงานความก้าวหน้า" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>หมวดหมู่ <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="คู่มือ">คู่มือ</SelectItem>
                                                <SelectItem value="แบบฟอร์ม">แบบฟอร์ม</SelectItem>
                                                <SelectItem value="ประกาศ">ประกาศ / คำสั่ง</SelectItem>
                                                <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="scholarshipScope"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ขอบเขตการเข้าถึง <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={(v) => {
                                            field.onChange(v);
                                            if (v === "ALL") form.setValue("scholarshipIds", []);
                                        }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกขอบเขต" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ALL">นิสิตทุกคน</SelectItem>
                                                <SelectItem value="SPECIFIC">เฉพาะทุนที่เลือก</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {scope === "SPECIFIC" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">ทุนการศึกษาที่เกี่ยวข้อง <span className="text-red-500">*</span></label>
                                <div className="rounded-lg border border-input p-3 space-y-2">
                                    {scholarships.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">ไม่มีทุนการศึกษาที่เปิดอยู่</p>
                                    ) : (
                                        scholarships.map(s => (
                                            <label key={s.id} className="flex items-center gap-2.5 cursor-pointer">
                                                <Checkbox
                                                    checked={selectedIds.includes(s.id)}
                                                    onCheckedChange={() => toggleScholarship(s.id)}
                                                />
                                                <span className="text-sm">{s.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                {selectedIds.length === 0 && (
                                    <p className="text-xs text-destructive">กรุณาเลือกอย่างน้อย 1 ทุน</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">ไฟล์เอกสาร (PDF, Word, Excel, รูปภาพ ขนาดไม่เกิน 2MB) <span className="text-red-500">*</span></label>
                            {form.watch("fileUrl") ? (
                                <div className="p-3 border rounded-md bg-slate-50 dark:bg-gray-700 flex items-center justify-between">
                                    <span className="text-sm truncate max-w-[300px]">{form.watch("fileName")}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 h-8"
                                        onClick={() => {
                                            form.setValue("fileUrl", "");
                                            form.setValue("fileName", "");
                                        }}
                                    >
                                        เปลี่ยนไฟล์
                                    </Button>
                                </div>
                            ) : (
                                <FileUpload
                                    onUpload={handleUploadFile}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    currentFileName={form.watch("fileName")}
                                    currentFileUrl={form.watch("fileUrl")}
                                />
                            )}
                            {form.formState.errors.fileUrl && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.fileUrl.message}</p>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="isPublished"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm">เผยแพร่ทันที</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex justify-end gap-2 border-t">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                className="bg-amber-700 hover:bg-amber-800"
                                disabled={isPending || !form.watch("fileUrl") || (scope === "SPECIFIC" && selectedIds.length === 0)}
                            >
                                {isPending ? "กำลังบันทึก..." : "บันทึกเอกสาร"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
