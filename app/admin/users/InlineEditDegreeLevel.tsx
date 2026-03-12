"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Pencil } from "lucide-react";
import { adminQuickUpdateStudentFieldAction } from "@/actions/admin";
import { DEGREE_LEVEL_OPTIONS } from "@/lib/validations";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface InlineEditDegreeLevelProps {
    userId: string;
    currentDegreeLevel: string | null;
}

export function InlineEditDegreeLevel({ userId, currentDegreeLevel }: InlineEditDegreeLevelProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [optimisticValue, setOptimisticValue] = useOptimistic(currentDegreeLevel);

    const handleSelect = (value: string) => {
        if (value === (currentDegreeLevel ?? "")) {
            setOpen(false);
            return;
        }
        setOpen(false);
        startTransition(async () => {
            setOptimisticValue(value || null);
            const result = await adminQuickUpdateStudentFieldAction(userId, "degreeLevel", value);
            if (result.error) alert(result.error);
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="group flex items-center gap-1.5 text-left rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    disabled={isPending}
                >
                    {optimisticValue ? (
                        <span className="text-xs font-medium text-slate-600 dark:text-gray-300 whitespace-nowrap">
                            {optimisticValue}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-300 dark:text-gray-600">—</span>
                    )}
                    <Pencil className="w-2.5 h-2.5 text-slate-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
                <div className="flex flex-col">
                    {DEGREE_LEVEL_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            className={`text-left text-xs px-3 py-1.5 rounded-md transition-colors ${
                                optimisticValue === opt
                                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-medium"
                                    : "hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300"
                            }`}
                            onClick={() => handleSelect(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
