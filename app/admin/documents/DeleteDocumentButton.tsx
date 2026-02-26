"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteDocumentAction } from "@/actions/document";

export function DeleteDocumentButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("ยืนยันการลบเอกสารนี้?")) {
            startTransition(async () => {
                const res = await deleteDocumentAction(id);
                if (res.error) {
                    alert(res.error);
                }
            });
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isPending}
        >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">ลบ</span>
        </Button>
    );
}
