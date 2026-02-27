"use client";

import { useOptimistic, useState, useTransition } from "react";
import { GraduationCap, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { adminChangeScholarshipAction } from "@/actions/admin";

interface Scholarship {
    id: string;
    name: string;
}

interface Props {
    userId: string;
    currentScholarshipId: string;
    currentScholarshipName: string;
    scholarships: Scholarship[];
}

export function ChangeScholarshipModal({
    userId,
    currentScholarshipId,
    currentScholarshipName,
    scholarships,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(currentScholarshipId);
    const [errorMsg, setErrorMsg] = useState("");

    // Optimistic name — changes immediately when admin confirms
    const [optimisticName, setOptimisticName] = useOptimistic(currentScholarshipName);

    const handleConfirm = () => {
        if (!selectedId || selectedId === currentScholarshipId) {
            setDialogOpen(false);
            return;
        }
        const chosen = scholarships.find((s) => s.id === selectedId);
        if (!chosen) return;

        setDialogOpen(false); // close immediately
        startTransition(async () => {
            setOptimisticName(chosen.name); // instant name update
            const result = await adminChangeScholarshipAction(userId, selectedId);
            if (result.error) {
                setErrorMsg(result.error);
                setDialogOpen(true); // reopen with error
            }
        });
    };

    const openDialog = () => {
        setSelectedId(currentScholarshipId);
        setErrorMsg("");
        setDialogOpen(true);
    };

    return (
        <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground">ทุนการศึกษา</div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    {optimisticName || "-"}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={openDialog}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700"
                    title="เปลี่ยนทุนการศึกษา"
                >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">เปลี่ยนทุน</span>
                </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>เปลี่ยนทุนการศึกษา</DialogTitle>
                        <DialogDescription>
                            เลือกทุนการศึกษาใหม่ที่ต้องการกำหนดให้นิสิต
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>ทุนการศึกษา</Label>
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกทุนการศึกษา" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scholarships.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {errorMsg && (
                            <p className="text-sm text-red-600">{errorMsg}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedId || isPending}
                            className="bg-amber-700 hover:bg-amber-800"
                        >
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
