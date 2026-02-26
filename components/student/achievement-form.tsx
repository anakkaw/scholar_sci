"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2, BookOpen, Trophy, FileCode2, FlaskConical, Medal, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Per-type field configuration for academic portfolio style
const TYPE_CONFIG = {
    PUBLICATION: {
        icon: BookOpen,
        color: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800/40",
        hint: "บทความวิจัย บทความวิชาการ รายงานทางวิทยาศาสตร์ หรือหนังสือที่ตีพิมพ์",
        titleLabel: "ชื่อบทความ / งานตีพิมพ์",
        titlePlaceholder: "ชื่อเต็มของบทความหรืองานตีพิมพ์",
        descLabel: "แหล่งตีพิมพ์ (วารสาร / ชื่อหนังสือ / Proceedings)",
        descPlaceholder: "เช่น Journal of Chemistry, Vol.12, No.3, pp.100-115 (2024)",
        dateLabel: "วันที่ตีพิมพ์",
        coAuthorsLabel: "ผู้แต่งร่วม (Co-authors)",
        coAuthorsPlaceholder: "เช่น นาย ก นามสกุล, นางสาว ข นามสกุล",
        urlLabel: "DOI / ลิงก์บทความ",
        urlPlaceholder: "https://doi.org/...",
    },
    COMPETITION: {
        icon: Trophy,
        color: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800/40",
        hint: "การแข่งขันทักษะ ประกวดผลงาน Hackathon หรือกิจกรรมที่มีการให้รางวัล",
        titleLabel: "ชื่อการแข่งขัน / รางวัลที่ได้รับ",
        titlePlaceholder: "เช่น รางวัลชนะเลิศอันดับ 1 การแข่งขัน...",
        descLabel: "ระดับและรายละเอียดการแข่งขัน",
        descPlaceholder: "เช่น ระดับชาติ/นานาชาติ, ผู้จัด, จำนวนทีมที่เข้าร่วม",
        dateLabel: "วันที่แข่งขัน",
        coAuthorsLabel: "สมาชิกทีม",
        coAuthorsPlaceholder: "ชื่อสมาชิกทีมอื่น (ถ้ามี)",
        urlLabel: "ลิงก์หลักฐาน / ประกาศผล",
        urlPlaceholder: "https://...",
    },
    PATENT: {
        icon: FileCode2,
        color: "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800/40",
        hint: "สิทธิบัตร อนุสิทธิบัตร ลิขสิทธิ์ หรือทรัพย์สินทางปัญญา",
        titleLabel: "ชื่อสิ่งประดิษฐ์ / ผลงานสร้างสรรค์",
        titlePlaceholder: "ชื่อสิ่งประดิษฐ์หรืองานสร้างสรรค์",
        descLabel: "ประเภทและรายละเอียด",
        descPlaceholder: "เช่น อนุสิทธิบัตร, ประเภท, รายละเอียดหลักของสิ่งประดิษฐ์",
        dateLabel: "วันที่ยื่น / วันที่ได้รับ",
        coAuthorsLabel: "ผู้ประดิษฐ์ร่วม",
        coAuthorsPlaceholder: "ชื่อผู้ร่วมประดิษฐ์ (ถ้ามี)",
        urlLabel: "เลขทะเบียน / ลิงก์สิทธิบัตร",
        urlPlaceholder: "หมายเลขสิทธิบัตร หรือ URL",
    },
    PROJECT: {
        icon: FlaskConical,
        color: "text-teal-600 bg-teal-50 border-teal-100 dark:text-teal-400 dark:bg-teal-900/20 dark:border-teal-800/40",
        hint: "โครงการวิจัย โครงการพัฒนา โครงการบริการวิชาการ หรือ thesis/dissertation",
        titleLabel: "ชื่อโครงการ",
        titlePlaceholder: "เช่น โครงการวิจัยเรื่อง...",
        descLabel: "บทบาทและรายละเอียดโครงการ",
        descPlaceholder: "บทบาทของคุณในโครงการ, ระยะเวลา, แหล่งทุน/ผู้สนับสนุน",
        dateLabel: "ช่วงปีที่ดำเนินการ",
        coAuthorsLabel: "ผู้ร่วมโครงการ / อาจารย์ที่ปรึกษา",
        coAuthorsPlaceholder: "ชื่อสมาชิกทีมหรืออาจารย์ที่ปรึกษา",
        urlLabel: "ลิงก์รายงาน / repository",
        urlPlaceholder: "https://...",
    },
    AWARD: {
        icon: Medal,
        color: "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-800/40",
        hint: "รางวัลเกียรติยศ เกียรติบัตร ทุนพิเศษ หรือการยกย่องชมเชยจากองค์กร",
        titleLabel: "ชื่อรางวัล / เกียรติบัตร",
        titlePlaceholder: "เช่น รางวัลนิสิตดีเด่น...",
        descLabel: "หน่วยงานที่มอบรางวัล / ระดับ / รายละเอียด",
        descPlaceholder: "ชื่อหน่วยงาน, ระดับรางวัล (ชาติ/มหาวิทยาลัย), เหตุผล",
        dateLabel: "วันที่ได้รับ",
        coAuthorsLabel: "หน่วยงานที่มอบ / ผู้รับร่วม",
        coAuthorsPlaceholder: "เช่น มหาวิทยาลัยนเรศวร, กระทรวง...",
        urlLabel: "ลิงก์ประกาศ / เกียรติบัตร",
        urlPlaceholder: "https://...",
    },
    OTHER: {
        icon: Sparkles,
        color: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-gray-700 dark:border-gray-600",
        hint: "กิจกรรมอาสาสมัคร การนำเสนองาน workshop การฝึกอบรม หรือผลงานอื่น ๆ",
        titleLabel: "ชื่อกิจกรรม / ผลงาน",
        titlePlaceholder: "ชื่อกิจกรรมหรือผลงาน",
        descLabel: "รายละเอียด",
        descPlaceholder: "รายละเอียดเพิ่มเติม",
        dateLabel: "วันที่",
        coAuthorsLabel: "ผู้เกี่ยวข้อง",
        coAuthorsPlaceholder: "ชื่อผู้เกี่ยวข้อง (ถ้ามี)",
        urlLabel: "ลิงก์อ้างอิง",
        urlPlaceholder: "https://...",
    },
} as const;

type ConfigKey = keyof typeof TYPE_CONFIG;

export function AchievementForm() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof AchievementSchema>>({
        resolver: zodResolver(AchievementSchema),
        defaultValues: { title: "", description: "", date: "", coAuthors: "", referenceUrl: "", attachmentUrl: "", attachmentName: "" },
    });

    const selectedType = form.watch("type") as ConfigKey | undefined;
    const cfg = selectedType ? TYPE_CONFIG[selectedType] : null;
    const IconComp = cfg?.icon;

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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(); setError(""); } }}>
            <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    เพิ่มผลงาน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>บันทึกผลงาน</DialogTitle>
                    <DialogDescription>เพิ่มผลงานทางวิชาการและกิจกรรมลง Portfolio ส่วนตัว</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
                        )}

                        {/* Type selector */}
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                <FormLabel>ประเภทผลงาน <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="เลือกประเภทผลงาน" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {ACHIEVEMENT_TYPES.filter(t => t.value !== "ACTIVITY").map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Contextual hint banner */}
                        {cfg && IconComp && (
                            <div className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs", cfg.color)}>
                                <IconComp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span>{cfg.hint}</span>
                            </div>
                        )}

                        {/* Title — dynamic label per type */}
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {cfg?.titleLabel ?? "ชื่อผลงาน / กิจกรรม"} <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={cfg?.titlePlaceholder ?? "ชื่อผลงานหรือกิจกรรม"}
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Description — dynamic label per type */}
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{cfg?.descLabel ?? "รายละเอียด"}</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={cfg?.descPlaceholder ?? "รายละเอียดเพิ่มเติม"}
                                        className="resize-none min-h-[80px]"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Date + Co-authors — dynamic labels */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{cfg?.dateLabel ?? "วันที่"}</FormLabel>
                                    <FormControl>
                                        <Input type="date" disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="coAuthors" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{cfg?.coAuthorsLabel ?? "ผู้ร่วมงาน"}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={cfg?.coAuthorsPlaceholder ?? "ชื่อผู้เกี่ยวข้อง"}
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Reference URL — dynamic label */}
                        <FormField control={form.control} name="referenceUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{cfg?.urlLabel ?? "ลิงก์อ้างอิง"}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="url"
                                        placeholder={cfg?.urlPlaceholder ?? "https://"}
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* File attachment */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">แนบไฟล์หลักฐานประกอบ (ถ้ามี)</label>
                            <FileUpload
                                onUpload={handleUploadFile}
                                disabled={isPending}
                                currentFileName={form.watch("attachmentName")}
                                currentFileUrl={form.watch("attachmentUrl")}
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={isPending} className="bg-amber-700 hover:bg-amber-800">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? "กำลังบันทึก..." : "บันทึกผลงาน"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
