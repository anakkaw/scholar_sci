"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfileSchema, MAJOR_OPTIONS } from "@/lib/validations";
import { adminUpdateStudentProfileAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    FormDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { computeYearLevel } from "@/lib/utils";

interface EditStudentProfileModalProps {
    userId: string;
    currentProfile: {
        fullName: string;
        nickname?: string | null;
        studentIdCode?: string | null;
        major?: string | null;
        phone?: string | null;
        backupEmail?: string | null;
        address?: string | null;
    };
}

export function EditStudentProfileModal({
    userId,
    currentProfile,
}: EditStudentProfileModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

    const initialMajor = MAJOR_OPTIONS.includes(currentProfile.major as any)
        ? (currentProfile.major as typeof MAJOR_OPTIONS[number])
        : "";

    const form = useForm<z.infer<typeof ProfileSchema>>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            fullName: currentProfile.fullName || "",
            nickname: currentProfile.nickname || "",
            studentIdCode: currentProfile.studentIdCode || "",
            major: initialMajor,
            phone: currentProfile.phone || "",
            backupEmail: currentProfile.backupEmail || "",
            address: currentProfile.address || "",
            profileImageUrl: "",
        },
    });

    const watchedStudentId = form.watch("studentIdCode");
    const computedYearLevel = computeYearLevel(watchedStudentId || "");

    const onSubmit = (values: z.infer<typeof ProfileSchema>) => {
        setSuccessMessage(null);
        setErrorMessage(null);

        startTransition(async () => {
            const result = await adminUpdateStudentProfileAction(userId, values);
            if (result.error) {
                setErrorMessage(result.error);
            } else if (result.success) {
                setSuccessMessage(result.success);
                setTimeout(() => {
                    setOpen(false);
                    setSuccessMessage(null);
                    form.reset(values);
                    router.refresh();
                }, 1200);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไขข้อมูล
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>แก้ไขข้อมูลนิสิต</DialogTitle>
                    <DialogDescription>
                        ผู้ดูแลระบบสามารถแก้ไขข้อมูลส่วนตัวและการศึกษาของนิสิตได้โดยตรง
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
                        {successMessage && (
                            <Alert className="bg-green-50 text-green-800 border-green-200">
                                <CheckCircle2 className="h-4 w-4 stroke-green-600" />
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}
                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* ─── ข้อมูลส่วนตัว ─── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                ข้อมูลส่วนตัว
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input disabled={isPending} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nickname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ชื่อเล่น</FormLabel>
                                            <FormControl>
                                                <Input disabled={isPending} placeholder="เช่น บอล, ปลา" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>เบอร์โทรศัพท์</FormLabel>
                                            <FormControl>
                                                <Input disabled={isPending} placeholder="08x-xxx-xxxx" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="backupEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>อีเมลสำรอง</FormLabel>
                                            <FormControl>
                                                <Input type="email" disabled={isPending} placeholder="example@gmail.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>ที่อยู่ปัจจุบัน</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    disabled={isPending}
                                                    rows={2}
                                                    placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* ─── ข้อมูลการศึกษา ─── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                ข้อมูลการศึกษา
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="studentIdCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                รหัสนิสิต <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={isPending}
                                                    placeholder="เช่น 68053127"
                                                    maxLength={10}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                ระบบคำนวณชั้นปีอัตโนมัติ
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Year level — read-only, auto-computed */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">ชั้นปี (คำนวณอัตโนมัติ)</label>
                                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center">
                                        {computedYearLevel ? (
                                            <span className="text-sm font-medium text-amber-700">
                                                ปีที่ {computedYearLevel}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                — กรุณากรอกรหัสนิสิตก่อน —
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="major"
                                    render={({ field }) => (
                                        <FormItem className="sm:col-span-2">
                                            <FormLabel>สาขาวิชา (ภาควิชา)</FormLabel>
                                            <Select
                                                disabled={isPending}
                                                onValueChange={field.onChange}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกสาขาวิชา..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {MAJOR_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt} value={opt}>
                                                            {opt}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => setOpen(false)}
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || !form.formState.isDirty}
                                className="bg-amber-700 hover:bg-amber-800 text-white"
                            >
                                {isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
