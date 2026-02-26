"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterSchema } from "@/lib/validations";
import { registerAction } from "@/actions/register";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// A minimal type definition so we can fetch scholarships
type ScholarshipOption = {
    id: string;
    name: string;
};

export const RegisterForm = () => {
    const router = useRouter();
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const [scholarships, setScholarships] = useState<ScholarshipOption[]>([]);

    useEffect(() => {
        // Fetch active scholarships for the dropdown
        fetch("/api/scholarships/active")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setScholarships(data);
            })
            .catch(err => console.error("Failed to fetch scholarships", err));
    }, []);

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            scholarshipId: "",
        },
    });

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError("");
        setSuccess("");
        startTransition(() => {
            registerAction(values).then((data) => {
                setError(data.error);
                setSuccess(data.success);
                if (data.success) {
                    setTimeout(() => router.push("/login"), 3000);
                }
            });
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ชื่อ-นามสกุล</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="นายเรียนดี ทุนสร้างชาติ"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>อีเมลมหาวิทยาลัย</FormLabel>
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
                        name="scholarshipId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ทุนการศึกษาที่ได้รับ</FormLabel>
                                <Select disabled={isPending || scholarships.length === 0} onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกทุนการศึกษา..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {scholarships.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รหัสผ่าน</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="********"
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
                                <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="********"
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

                {success && (
                    <div className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-600">
                        <p>{success}</p>
                    </div>
                )}

                <Button disabled={isPending || success !== ""} type="submit" className="w-full">
                    {isPending ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
                </Button>
            </form>
        </Form>
    );
};
