"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { adminDeleteUserAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface Props {
    userId: string;
    email: string;
}

export function DeleteUserButton({ userId, email }: Props) {
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            title="ลบผู้ใช้"
            className="h-7 w-7 p-0 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300"
            onClick={() => {
                if (!confirm(`ยืนยันการลบผู้ใช้ ${email}?\n\nข้อมูลทั้งหมดของนิสิตจะถูกลบอย่างถาวร`)) return;
                startTransition(async () => {
                    const res = await adminDeleteUserAction(userId);
                    if (res.error) alert(res.error);
                });
            }}
        >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">ลบผู้ใช้</span>
        </Button>
    );
}
