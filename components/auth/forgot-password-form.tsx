"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ForgotPasswordSchema } from "@/lib/validations";
import { forgotPasswordAction } from "@/actions/forgot-password";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState<string | undefined>();

    const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = (values: z.infer<typeof ForgotPasswordSchema>) => {
        setError(undefined);
        setSuccess(undefined);
        startTransition(async () => {
            const result = await forgotPasswordAction(values);
            if (result.error) setError(result.error);
            if (result.success) setSuccess(result.success);
        });
    };

    if (success) {
        return (
            <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">{success}</p>
                    <p className="text-xs text-muted-foreground">ลิงก์จะหมดอายุใน 1 ชั่วโมง กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam)</p>
                </div>
                <Link href="/login">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        กลับไปหน้าเข้าสู่ระบบ
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                    <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้</span>
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>อีเมล (Email)</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    disabled={isPending}
                                    placeholder="xxxxxxxx@nu.ac.th"
                                    type="email"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Button disabled={isPending} type="submit" className="w-full">
                    {isPending ? "กำลังส่งอีเมล..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                </Button>

                <div className="text-center">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-amber-700 transition-colors inline-flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </div>
            </form>
        </Form>
    );
}
