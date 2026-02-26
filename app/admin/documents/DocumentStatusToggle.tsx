"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleDocumentPublishAction } from "@/actions/document";

export function DocumentStatusToggle({ id, initialState }: { id: string, initialState: boolean }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (checked: boolean) => {
        startTransition(async () => {
            const res = await toggleDocumentPublishAction(id, checked);
            if (res.error) {
                alert(res.error);
            }
        });
    };

    return (
        <div className="flex items-center justify-center">
            <Switch
                id={`publish-${id}`}
                checked={initialState}
                onCheckedChange={handleToggle}
                disabled={isPending}
            />
        </div>
    );
}
