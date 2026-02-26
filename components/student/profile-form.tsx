"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StudentProfile, Scholarship } from "@prisma/client";
import { updateProfileAction } from "@/actions/update-profile";
import { ProfileSchema, MAJOR_OPTIONS, DEGREE_LEVEL_OPTIONS } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle2, AlertCircle, GraduationCap } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import { computeYearLevel } from "@/lib/utils";

type ProfileWithScholarship = StudentProfile & { scholarship: Scholarship | null };

interface ProfileFormProps {
    userProfile: ProfileWithScholarship;
}

export function ProfileForm({ userProfile }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Determine a valid initial major value (must match enum or be empty)
    const initialMajor = MAJOR_OPTIONS.includes(userProfile.major as any)
        ? (userProfile.major as typeof MAJOR_OPTIONS[number])
        : "";

    const initialDegreeLevel = DEGREE_LEVEL_OPTIONS.includes(userProfile.degreeLevel as any)
        ? (userProfile.degreeLevel as typeof DEGREE_LEVEL_OPTIONS[number])
        : "";

    const form = useForm<z.infer<typeof ProfileSchema>>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            fullName: userProfile.fullName || "",
            nickname: userProfile.nickname || "",
            studentIdCode: userProfile.studentIdCode || "",
            major: initialMajor,
            faculty: userProfile.faculty || "",
            degreeLevel: initialDegreeLevel,
            phone: userProfile.phone || "",
            backupEmail: userProfile.backupEmail || "",
            address: userProfile.address || "",
            profileImageUrl: userProfile.profileImageUrl || "",
        },
    });

    // Watch studentIdCode to display computed year level in real-time
    const watchedStudentId = form.watch("studentIdCode");
    const computedYearLevel = computeYearLevel(watchedStudentId || "");

    const handleUploadProfileImage = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "profiles");

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        form.setValue("profileImageUrl", data.url, { shouldDirty: true });
        onSubmit({ ...form.getValues(), profileImageUrl: data.url });
    };

    const onSubmit = (values: z.infer<typeof ProfileSchema>) => {
        setSuccessMessage(null);
        setErrorMessage(null);

        startTransition(async () => {
            const result = await updateProfileAction(values);
            if (result.error) {
                setErrorMessage(result.error);
            }
            if (result.success) {
                setSuccessMessage(result.success);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column: avatar + scholarship info */}
            <div className="md:col-span-1 space-y-6">
                <div>
                    <h3 className="text-lg font-medium">รูปประจำตัว</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        ขนาดไฟล์ไม่เกิน 2MB รองรับ JPEG, PNG, WEBP
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        {form.watch("profileImageUrl") ? (
                            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <img
                                    src={form.watch("profileImageUrl")}
                                    alt="Profile"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        ) : (
                            <div className="w-40 h-40 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                                <span className="text-slate-400">ไม่มีรูป</span>
                            </div>
                        )}
                        <FileUpload
                            onUpload={handleUploadProfileImage}
                            accept=".jpg,.jpeg,.png,.webp"
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                    <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-amber-600" />
                        ข้อมูลทุนการศึกษา
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="text-muted-foreground block text-xs">ชื่อทุน</span>
                            <span className="font-medium">{userProfile.scholarship?.name || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs">สถานะในโครงการ</span>
                            <span className="font-medium text-green-600">กำลังรับทุน</span>
                        </div>
                        {computedYearLevel && (
                            <div>
                                <span className="text-muted-foreground block text-xs">ชั้นปีปัจจุบัน</span>
                                <Badge variant="outline" className="mt-0.5 border-amber-300 text-amber-700 bg-amber-50">
                                    ปีที่ {computedYearLevel}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right column: form fields */}
            <div className="md:col-span-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input disabled={isPending} placeholder="นายเรียนดี ทุนสร้างชาติ" {...field} />
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
                                            <FormDescription className="text-xs">
                                                นอกเหนือจากอีเมลมหาวิทยาลัย
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>ที่อยู่ปัจจุบัน</FormLabel>
                                            <FormControl>
                                                <Textarea disabled={isPending} rows={3} placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" {...field} />
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                ระบบจะคำนวณชั้นปีโดยอัตโนมัติจากรหัสนิสิต
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Year level — read-only, auto-computed */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">ชั้นปี</label>
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
                                    <p className="text-xs text-muted-foreground">
                                        คำนวณอัตโนมัติจากรหัสนิสิต ไม่สามารถแก้ไขได้
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="degreeLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ระดับการศึกษา</FormLabel>
                                            <Select
                                                disabled={isPending}
                                                onValueChange={field.onChange}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกระดับการศึกษา..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {DEGREE_LEVEL_OPTIONS.map((opt) => (
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

                                <FormField
                                    control={form.control}
                                    name="major"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ภาควิชา</FormLabel>
                                            <Select
                                                disabled={isPending}
                                                onValueChange={field.onChange}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกภาควิชา..." />
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

                                <FormField
                                    control={form.control}
                                    name="faculty"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>สาขาวิชา</FormLabel>
                                            <FormControl>
                                                <Input
                                                    disabled={isPending}
                                                    placeholder="เช่น วิทยาศาสตร์คณิตศาสตร์, เคมีประยุกต์"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
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
            </div>
        </div>
    );
}
