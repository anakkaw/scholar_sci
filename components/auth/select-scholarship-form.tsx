"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

const SelectScholarshipSchema = z.object({
    fullName: z.string().min(1, { message: "กรุณากรอกชื่อ-นามสกุล" }),
    scholarshipId: z.string().min(1, { message: "กรุณาเลือกทุนการศึกษา" }),
});

type ScholarshipOption = {
    id: string;
    name: string;
};

export const SelectScholarshipForm = () => {
    const router = useRouter();
    const { data: session, update: updateSession } = useSession();

    const [error, setError] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const [scholarships, setScholarships] = useState<ScholarshipOption[]>([]);

    useEffect(() => {
        fetch("/api/scholarships/active")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setScholarships(data);
            })
            .catch(err => console.error("Failed to fetch scholarships", err));
    }, []);

    const form = useForm<z.infer<typeof SelectScholarshipSchema>>({
        resolver: zodResolver(SelectScholarshipSchema),
        defaultValues: {
            fullName: session?.user?.name || "",
            scholarshipId: "",
        },
    });

    // Update fullName if session loads later
    useEffect(() => {
        if (session?.user?.name && !form.getValues("fullName")) {
            form.setValue("fullName", session.user.name);
        }
    }, [session, form]);

    const onSubmit = (values: z.infer<typeof SelectScholarshipSchema>) => {
        setError("");
        startTransition(async () => {
            try {
                // We submit to a new API endpoint specifically for completing Google OAuth signups
                const response = await fetch("/api/auth/complete-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "เกิดข้อผิดพลาด");
                    return;
                }

                // Refresh the NextAuth session so middleware knows we have a scholarship now
                await updateSession();

                router.push("/dashboard");
                router.refresh();
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
                </div>

                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                        <p>{error}</p>
                    </div>
                )}

                <Button disabled={isPending} type="submit" className="w-full">
                    {isPending ? "กำลังบันทึกข้อมูล..." : "ยืนยันข้อมูลและเข้าใช้งาน"}
                </Button>
            </form>
        </Form>
    );
};
