"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleScholarshipStatusAction } from "@/actions/scholarship";

export function ScholarshipStatusToggle({ id, initialState }: { id: string, initialState: boolean }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            const res = await toggleScholarshipStatusAction(id, checked);
            if (res.error) {
                alert(res.error);
            }
        });
    };

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id={`status-${id}`}
                checked={initialState}
                onCheckedChange={handleToggle}
                disabled={isPending}
            />
            <label
                htmlFor={`status-${id}`}
                className={`text-sm font-medium leading-none ${initialState ? "text-green-600" : "text-slate-500"}`}
            >
                {initialState ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
            </label>
        </div>
    );
}
