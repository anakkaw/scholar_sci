"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { GraduationCap } from "lucide-react";
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
    _count: { studentProfiles: number };
}

interface Props {
    scholarships: Scholarship[];
    currentScholarshipId: string;
}

export function ScholarshipFilterSelect({ scholarships, currentScholarshipId }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "ALL") {
            params.set("scholarship", value);
        } else {
            params.delete("scholarship");
        }
        // Reset to page 1 when filter changes
        params.delete("page");
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="relative">
            <Select value={currentScholarshipId || "ALL"} onValueChange={handleChange}>
                <SelectTrigger
                    className={`h-9 text-xs min-w-[180px] border-slate-200 dark:border-gray-700 transition-colors
                        ${currentScholarshipId ? "border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-900/20" : ""}
                        ${isPending ? "opacity-60" : ""}`}
                >
                    <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder="ทุกทุน" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                        <span className="font-medium">ทุกทุน</span>
                    </SelectItem>
                    {scholarships.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                            <span>{s.name}</span>
                            <span className="ml-1.5 text-muted-foreground">({s._count.studentProfiles})</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
