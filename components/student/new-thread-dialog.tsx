"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageThreadSchema } from "@/lib/validations";
import { createThreadAction } from "@/actions/messages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenSquare } from "lucide-react";

type FormValues = z.infer<typeof MessageThreadSchema>;

export function NewThreadDialog() {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(MessageThreadSchema),
        defaultValues: { subject: "", content: "" },
    });

    async function onSubmit(values: FormValues) {
        setPending(true);
        setError("");
        const result = await createThreadAction(values);
        setPending(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        form.reset();
        setOpen(false);
        if (result.threadId) {
            router.push(`/messages?threadId=${result.threadId}`);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl">
                    <PenSquare className="h-4 w-4" />
                    ส่งข้อความใหม่
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg">ส่งข้อความหาผู้ดูแลระบบ</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="subject">หัวข้อ <span className="text-destructive">*</span></Label>
                        <Input
                            id="subject"
                            placeholder="เช่น ขอข้อมูลเพิ่มเติมเกี่ยวกับทุน"
                            {...form.register("subject")}
                            className="rounded-xl"
                        />
                        {form.formState.errors.subject && (
                            <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="content">ข้อความ <span className="text-destructive">*</span></Label>
                        <textarea
                            id="content"
                            rows={5}
                            placeholder="พิมพ์ข้อความของคุณที่นี่..."
                            {...form.register("content")}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 resize-none"
                        />
                        {form.formState.errors.content && (
                            <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
                        )}
                    </div>
                    {error && (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={pending} className="rounded-xl">
                            {pending ? "กำลังส่ง..." : "ส่งข้อความ"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
