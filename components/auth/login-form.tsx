"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoginSchema } from "@/lib/validations";
// Using Next-Auth's signIn client component
import { signIn } from "next-auth/react";

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

export const LoginForm = () => {
    const router = useRouter();
    const [error, setError] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        startTransition(async () => {
            try {
                const response = await signIn("credentials", {
                    email: values.email,
                    password: values.password,
                    redirect: false,
                });

                if (response?.error) {
                    if (response.code === "email_not_verified") {
                        setError("กรุณายืนยันอีเมล @nu.ac.th ก่อนเข้าสู่ระบบ — ตรวจสอบกล่องจดหมายของท่าน");
                    } else if (response.code === "too_many_attempts") {
                        setError("พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่");
                    } else {
                        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
                    }
                } else {
                    window.location.href = "/dashboard";
                }
            } catch (err) {
                setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            }
        });
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
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                        <p>{error}</p>
                    </div>
                )}
                <Button disabled={isPending} type="submit" className="w-full">
                    {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
            </form>
        </Form>
    );
};
