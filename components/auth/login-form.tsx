"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { LoginSchema } from "@/lib/validations";
import { signIn } from "next-auth/react";
import { resendVerificationAction } from "@/actions/resend-verification";

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
import Link from "next/link";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export const LoginForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const [showResend, setShowResend] = useState(false);
    const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isResending, setIsResending] = useState(false);

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setShowResend(false);
        setResendStatus(null);
        startTransition(async () => {
            try {
                const response = await signIn("credentials", {
                    email: values.email,
                    password: values.password,
                    redirect: false,
                });

                if (response?.error) {
                    if (response.code === "email_not_verified") {
                        setError("กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
                        setShowResend(true);
                    } else if (response.code === "too_many_attempts") {
                        setError("พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่");
                    } else {
                        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
                    }
                } else {
                    window.location.href = "/dashboard";
                }
            } catch {
                setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            }
        });
    };

    const handleResend = async () => {
        const email = form.getValues("email");
        if (!email) {
            setResendStatus({ type: "error", message: "กรุณากรอกอีเมลก่อน" });
            return;
        }

        setIsResending(true);
        setResendStatus(null);

        try {
            const result = await resendVerificationAction(email);
            if (result.error) {
                setResendStatus({ type: "error", message: result.error });
            } else {
                setResendStatus({ type: "success", message: result.success! });
            }
        } catch {
            setResendStatus({ type: "error", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
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
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>รหัสผ่าน (Password)</FormLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-amber-700 hover:text-amber-800 hover:underline transition-colors"
                                    >
                                        ลืมรหัสผ่าน?
                                    </Link>
                                </div>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="******"
                                        type="password"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive space-y-2">
                        <p>{error}</p>
                        {showResend && (
                            <div className="pt-1 border-t border-destructive/10">
                                <p className="text-xs text-muted-foreground mb-1.5">
                                    ไม่ได้รับอีเมล? ลองตรวจสอบโฟลเดอร์ Spam หรือ
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isResending}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline transition-colors disabled:opacity-50"
                                >
                                    {isResending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Mail className="w-3 h-3" />
                                    )}
                                    {isResending ? "กำลังส่ง..." : "ส่งอีเมลยืนยันอีกครั้ง"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {resendStatus && (
                    <div className={`p-3 rounded-md text-sm ${
                        resendStatus.type === "success"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-destructive/15 text-destructive"
                    }`}>
                        <div className="flex items-start gap-2">
                            {resendStatus.type === "success" && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                            <p>{resendStatus.message}</p>
                        </div>
                    </div>
                )}

                <Button disabled={isPending} type="submit" className="w-full">
                    {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
            </form>
        </Form>
    );
};
