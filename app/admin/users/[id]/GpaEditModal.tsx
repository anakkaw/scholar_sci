"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { adminUpdateAcademicRecordAction } from "@/actions/admin";

const GpaEditSchema = z.object({
    gpa:  z.coerce.number().min(0, "GPA ต้องไม่ต่ำกว่า 0").max(4, "GPA ต้องไม่เกิน 4.00"),
    gpax: z.coerce.number().min(0, "GPAX ต้องไม่ต่ำกว่า 0").max(4, "GPAX ต้องไม่เกิน 4.00").optional(),
    note: z.string().optional(),
});

type GpaEditValues = z.infer<typeof GpaEditSchema>;

interface Props {
    recordId: string;
    currentGpa: number;
    currentGpax: number | null;
    academicYear: string;
    semester: string;
}

export function GpaEditModal({ recordId, currentGpa, currentGpax, academicYear, semester }: Props) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const form = useForm<GpaEditValues>({
        resolver: zodResolver(GpaEditSchema),
        defaultValues: { gpa: currentGpa, gpax: currentGpax ?? undefined, note: "" },
    });

    const onSubmit = (values: GpaEditValues) => {
        setMessage(null);
        startTransition(async () => {
            const result = await adminUpdateAcademicRecordAction(
                recordId,
                values.gpa,
                values.gpax ?? null,
                values.note || undefined
            );
            if (result.success) {
                setMessage({ type: "success", text: result.success });
                setTimeout(() => setOpen(false), 1200);
            } else {
                setMessage({ type: "error", text: result.error ?? "เกิดข้อผิดพลาด" });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset({ gpa: currentGpa, gpax: currentGpax ?? undefined, note: "" }); setMessage(null); } }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">แก้ไข GPA</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>แก้ไข GPA / GPAX</DialogTitle>
                    <DialogDescription>
                        ปีการศึกษา {academicYear} ภาคเรียนที่ {semester}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="gpa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GPA (0.00 - 4.00)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="4"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gpax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GPAX สะสม</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="4"
                                                placeholder="-"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="ระบุเหตุผลในการแก้ไข..."
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {message && (
                            <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                {message.text}
                            </p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={isPending} className="bg-amber-700 hover:bg-amber-800">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                บันทึกและยืนยัน
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
