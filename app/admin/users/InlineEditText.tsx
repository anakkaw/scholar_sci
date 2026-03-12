"use client";

import { useState, useOptimistic, useTransition, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { adminQuickUpdateStudentFieldAction } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface InlineEditTextProps {
    userId: string;
    field: "fullName" | "studentIdCode";
    currentValue: string | null;
    placeholder?: string;
}

export function InlineEditText({ userId, field, currentValue, placeholder }: InlineEditTextProps) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(currentValue ?? "");
    const [isPending, startTransition] = useTransition();
    const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setDraft(currentValue ?? "");
            setTimeout(() => inputRef.current?.select(), 50);
        }
    }, [open, currentValue]);

    const handleSave = () => {
        const trimmed = draft.trim();
        if (trimmed === (currentValue ?? "")) {
            setOpen(false);
            return;
        }
        setOpen(false);
        startTransition(async () => {
            setOptimisticValue(trimmed || null);
            const result = await adminQuickUpdateStudentFieldAction(userId, field, trimmed);
            if (result.error) alert(result.error);
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="group flex items-center gap-1.5 text-left rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors w-full min-w-0"
                    disabled={isPending}
                >
                    {optimisticValue ? (
                        <span className="text-xs font-medium text-slate-600 dark:text-gray-300 truncate">
                            {optimisticValue}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-300 dark:text-gray-600">
                            {placeholder ?? "—"}
                        </span>
                    )}
                    <Pencil className="w-2.5 h-2.5 text-slate-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <form
                    onSubmit={e => { e.preventDefault(); handleSave(); }}
                    className="flex items-center gap-2"
                >
                    <Input
                        ref={inputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        placeholder={placeholder}
                        className="h-8 text-sm"
                    />
                    <Button type="submit" size="sm" className="h-8 px-3 shrink-0">
                        บันทึก
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    );
}
