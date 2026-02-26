"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ResetPasswordSchema } from "@/lib/validations";
import { resetPasswordAction } from "@/actions/reset-password";
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
import { CheckCircle2 } from "lucide-react";

export function ResetPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState<string | undefined>();

    const form = useForm<z.infer<typeof ResetPasswordSchema>>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
        setError(undefined);
        startTransition(async () => {
            const result = await resetPasswordAction(token, values);
            if (result.error) setError(result.error);
            if (result.success) {
                setSuccess(result.success);
                setTimeout(() => router.push("/login"), 2500);
            }
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
                    <p className="text-xs text-muted-foreground">กำลังนำคุณไปหน้าเข้าสู่ระบบ...</p>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>รหัสผ่านใหม่</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    disabled={isPending}
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    type="password"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    disabled={isPending}
                                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                                    type="password"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md text-sm text-destructive">
                        {error}
                        {error.includes("หมดอายุ") && (
                            <span> <Link href="/forgot-password" className="underline font-medium">ขอลิงก์ใหม่</Link></span>
                        )}
                    </div>
                )}

                <Button disabled={isPending} type="submit" className="w-full">
                    {isPending ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
                </Button>
            </form>
        </Form>
    );
}
