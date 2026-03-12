"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Pencil, Loader2, X, Plus } from "lucide-react";
import { createMandatoryActivityAction, updateMandatoryActivityAction } from "@/actions/admin";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Scholarship {
    id: string;
    name: string;
}

interface ActivityData {
    id: string;
    title: string;
    description: string | null;
    scholarshipId: string | null;
    degreeLevel: string | null;
    yearLevel: number | null;
    requirements: string[];
}

const DEGREE_LEVELS = ["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"];

export function MandatoryActivityForm({
    scholarships,
    activity,
}: {
    scholarships: Scholarship[];
    activity?: ActivityData;
}) {
    const isEdit = !!activity;
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState(activity?.title ?? "");
    const [description, setDescription] = useState(activity?.description ?? "");
    const [scholarshipId, setScholarshipId] = useState<string>(activity?.scholarshipId ?? "");
    const [degreeLevel, setDegreeLevel] = useState<string>(activity?.degreeLevel ?? "");
    const [yearLevel, setYearLevel] = useState<string>(activity?.yearLevel ? String(activity.yearLevel) : "");
    const [requirements, setRequirements] = useState<string[]>(activity?.requirements ?? []);
    const [error, setError] = useState<string | null>(null);

    const addRequirement = () => setRequirements(prev => [...prev, ""]);
    const removeRequirement = (idx: number) => setRequirements(prev => prev.filter((_, i) => i !== idx));
    const updateRequirement = (idx: number, value: string) =>
        setRequirements(prev => prev.map((r, i) => i === idx ? value : r));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!title.trim()) { setError("กรุณาระบุชื่อกิจกรรม"); return; }

        const filteredReqs = requirements.map(r => r.trim()).filter(Boolean);

        const payload = {
            title,
            description,
            scholarshipId: (scholarshipId && scholarshipId !== "__all__") ? scholarshipId : undefined,
            degreeLevel: (degreeLevel && degreeLevel !== "__all__") ? degreeLevel : undefined,
            yearLevel: (yearLevel && yearLevel !== "__all__") ? parseInt(yearLevel) : undefined,
            requirements: filteredReqs,
        };

        startTransition(async () => {
            const result = isEdit
                ? await updateMandatoryActivityAction(activity.id, payload)
                : await createMandatoryActivityAction(payload);
            if (result.error) { setError(result.error); return; }
            if (!isEdit) {
                setTitle(""); setDescription("");
                setScholarshipId(""); setDegreeLevel(""); setYearLevel("");
                setRequirements([]);
            }
            setError(null);
            setOpen(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30">
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                ) : (
                    <Button className="bg-amber-700 hover:bg-amber-800">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        สร้างกิจกรรมบังคับ
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "แก้ไขกิจกรรม" : "สร้างกิจกรรมบังคับ"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "แก้ไขรายละเอียดและเงื่อนไขของกิจกรรม หากเปลี่ยนเงื่อนไข ระบบจะเพิ่มนิสิตที่ตรงเงื่อนไขใหม่โดยอัตโนมัติ"
                            : "กำหนดกิจกรรมและเงื่อนไขนิสิตที่ต้องเข้าร่วม ระบบจะกำหนดให้นิสิตที่ตรงเงื่อนไขโดยอัตโนมัติ"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">ชื่อกิจกรรม <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="เช่น อบรม Research Methodology 2569"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">รายละเอียด</label>
                        <Textarea
                            placeholder="รายละเอียดกิจกรรม..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Requirements checklist */}
                    <div className="border-t pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">งานที่ต้องส่ง</p>
                        <p className="text-[11px] text-muted-foreground -mt-1">กำหนดรายการที่นิสิตต้องทำเพื่อผ่านกิจกรรม</p>
                        <div className="space-y-2">
                            {requirements.map((req, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                                    <Input
                                        placeholder="เช่น ส่งรายงานสรุป, แนบใบเข้าร่วม"
                                        value={req}
                                        onChange={e => updateRequirement(idx, e.target.value)}
                                        className="text-sm"
                                    />
                                    <Button type="button" variant="ghost" size="icon"
                                        className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                        onClick={() => removeRequirement(idx)}>
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm"
                                className="text-xs gap-1.5 h-8"
                                onClick={addRequirement}>
                                <Plus className="w-3 h-3" />
                                เพิ่มรายการ
                            </Button>
                        </div>
                    </div>

                    {/* Filter criteria */}
                    <div className="border-t pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">เงื่อนไขนิสิตที่ต้องเข้าร่วม</p>
                        <p className="text-[11px] text-muted-foreground -mt-1">หากไม่เลือกจะกำหนดให้นิสิตทุกกลุ่ม</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">ทุนการศึกษา</label>
                                <Select value={scholarshipId || "__all__"} onValueChange={setScholarshipId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="ทุกทุน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">ทุกทุน</SelectItem>
                                        {scholarships.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">ระดับการศึกษา</label>
                                    <Select value={degreeLevel || "__all__"} onValueChange={setDegreeLevel}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="ทุกระดับ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">ทุกระดับ</SelectItem>
                                            {DEGREE_LEVELS.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">ชั้นปี</label>
                                    <Select value={yearLevel || "__all__"} onValueChange={setYearLevel}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="ทุกชั้นปี" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">ทุกชั้นปี</SelectItem>
                                            {[1, 2, 3, 4, 5, 6].map(y => (
                                                <SelectItem key={y} value={String(y)}>ปีที่ {y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending
                                ? (isEdit ? "กำลังบันทึก..." : "กำลังสร้าง...")
                                : (isEdit ? "บันทึก" : "สร้างกิจกรรม")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
