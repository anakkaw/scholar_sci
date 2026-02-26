"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScholarshipSchema } from "@/lib/validations";
import { saveScholarshipAction, deleteScholarshipAction } from "@/actions/scholarship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileStack } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type ScholarshipFormValues = z.infer<typeof ScholarshipSchema>;

interface ScholarshipFormProps {
    initialData: any | null;
    scholarshipId: string | null;
}

export function ScholarshipForm({ initialData, scholarshipId }: ScholarshipFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<ScholarshipFormValues>({
        resolver: zodResolver(ScholarshipSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            description: initialData.description || "",
            active: initialData.active,
            minGpa:  initialData.minGpa  || "",
            minGpax: initialData.minGpax || "",
            milestones: initialData.milestones?.map((m: any) => ({
                id: m.id,
                title: m.title,
                description: m.description || "",
                targetYearLevel: m.targetYearLevel,
                targetSemester: m.targetSemester,
                orderIndex: m.orderIndex,
            })) || [],
        } : {
            name: "",
            description: "",
            active: true,
            minGpa: "",
            minGpax: "",
            milestones: [],
        },
    });

    const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } = useFieldArray({
        name: "milestones",
        control: form.control,
    });

    const onSubmit = (data: ScholarshipFormValues) => {
        startTransition(async () => {
            const res = await saveScholarshipAction(scholarshipId || "new", data);
            if (res.error) {
                alert(res.error);
            } else {
                alert(res.success);
                router.push("/admin/scholarships");
                router.refresh();
            }
        });
    };

    const handleDelete = () => {
        if (!scholarshipId) return;
        if (confirm("คุณแน่ใจหรือไม่ที่จะลบโครงการทุนนี้? นิสิตที่เชื่อมโยงกับทุนนี้อาจได้รับผลกระทบ")) {
            startTransition(async () => {
                const res = await deleteScholarshipAction(scholarshipId);
                if (res.error) {
                    alert(res.error);
                } else {
                    alert(res.success);
                    router.push("/admin/scholarships");
                    router.refresh();
                }
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลทั่วไป</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ชื่อทุนการศึกษา <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="เช่น ทุนช้างเผือก ประจำปีการศึกษา 2567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รายละเอียดเพิ่มเติม</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="อธิบายเงื่อนไขทั่วไป หรือวัตถุประสงค์ของโครงการทุน"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="minGpa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GPA ขั้นต่ำต่อภาคเรียน</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="0" max="4" placeholder="เช่น 3.00" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">ปล่อยว่างถ้าไม่กำหนด</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minGpax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GPAX ขั้นต่ำ (เกรดสะสม)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" min="0" max="4" placeholder="เช่น 3.00" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">ปล่อยว่างถ้าไม่กำหนด</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            สถานะการเปิดรับ
                                        </FormLabel>
                                        <FormDescription>
                                            กำหนดให้โครงการสามารถถูกเลือกได้ตอนนิสิตสมัครใหม่
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Milestones Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <FileStack className="h-5 w-5 text-amber-600" />
                            <CardTitle>กำหนดการส่งรายงานโครงงาน (Milestones)</CardTitle>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendMilestone({ title: "", description: "", targetYearLevel: 1, targetSemester: "1", orderIndex: milestoneFields.length })}
                        >
                            <Plus className="h-4 w-4 mr-2" /> เพิ่ม Milestone
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {milestoneFields.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                ยังไม่มีการกำหนด milestone — คลิก "เพิ่ม Milestone" เพื่อเพิ่มรายการรายงานที่ต้องส่ง
                            </div>
                        ) : (
                            milestoneFields.map((field, index) => (
                                <div key={field.id} className="relative border rounded-lg p-4 bg-amber-50 space-y-3 group">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeMilestone(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    <div className="text-xs font-semibold text-amber-700">Milestone {index + 1}</div>

                                    <FormField
                                        control={form.control}
                                        name={`milestones.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ชื่อรายงาน <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input placeholder="เช่น ส่งหัวข้อโครงงาน, ส่งโครงร่าง, ส่งรายงานฉบับสมบูรณ์" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`milestones.${index}.targetYearLevel`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ปีการศึกษาที่ต้องส่ง <span className="text-red-500">*</span></FormLabel>
                                                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="เลือกปี" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {[1,2,3,4,5,6].map(y => (
                                                                <SelectItem key={y} value={String(y)}>ปี {y}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`milestones.${index}.targetSemester`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ภาคเรียนที่ต้องส่ง <span className="text-red-500">*</span></FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="เลือกภาคเรียน" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                                                            <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                                                            <SelectItem value="3">ภาคฤดูร้อน</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={`milestones.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>คำอธิบายเพิ่มเติม</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="คำอธิบายหรือข้อกำหนดของรายงานนี้ (ไม่บังคับ)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center bg-white p-4 py-8 border-t border-slate-200 mt-8 sticky bottom-0 left-0 right-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {scholarshipId ? (
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isPending}
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> ลบโครงการทุนนี้
                        </Button>
                    ) : (
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            ยกเลิก
                        </Button>
                    )}

                    <Button type="submit" className="bg-amber-700 hover:bg-amber-800 min-w-[200px]" disabled={isPending}>
                        {isPending ? "กำลังบันทึก..." : (scholarshipId ? "บันทึกการแก้ไข" : "สร้างทุนการศึกษา")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
