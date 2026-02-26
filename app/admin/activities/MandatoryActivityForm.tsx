"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { createMandatoryActivityAction } from "@/actions/admin";
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

const DEGREE_LEVELS = ["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"];

export function MandatoryActivityForm({ scholarships }: { scholarships: Scholarship[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [scholarshipId, setScholarshipId] = useState<string>("");
    const [degreeLevel, setDegreeLevel] = useState<string>("");
    const [yearLevel, setYearLevel] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!title.trim()) { setError("กรุณาระบุชื่อกิจกรรม"); return; }
        startTransition(async () => {
            const result = await createMandatoryActivityAction({
                title,
                description,
                scholarshipId: (scholarshipId && scholarshipId !== "__all__") ? scholarshipId : undefined,
                degreeLevel: (degreeLevel && degreeLevel !== "__all__") ? degreeLevel : undefined,
                yearLevel: (yearLevel && yearLevel !== "__all__") ? parseInt(yearLevel) : undefined,
            });
            if (result.error) { setError(result.error); return; }
            setTitle(""); setDescription("");
            setScholarshipId(""); setDegreeLevel(""); setYearLevel(""); setError(null);
            setOpen(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    สร้างกิจกรรมบังคับ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>สร้างกิจกรรมบังคับ</DialogTitle>
                    <DialogDescription>
                        กำหนดกิจกรรมและเงื่อนไขนิสิตที่ต้องเข้าร่วม ระบบจะกำหนดให้นิสิตที่ตรงเงื่อนไขโดยอัตโนมัติ
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
                    <div className="border-t pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">เงื่อนไขนิสิตที่ต้องเข้าร่วม</p>
                        <p className="text-[11px] text-muted-foreground -mt-1">หากไม่เลือกจะกำหนดให้นิสิตทุกกลุ่ม</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">ทุนการศึกษา</label>
                                <Select value={scholarshipId} onValueChange={setScholarshipId}>
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
                                    <Select value={degreeLevel} onValueChange={setDegreeLevel}>
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
                                    <Select value={yearLevel} onValueChange={setYearLevel}>
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
                            {isPending ? "กำลังสร้าง..." : "สร้างกิจกรรม"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
