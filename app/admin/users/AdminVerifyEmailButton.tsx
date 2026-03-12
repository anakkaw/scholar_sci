"use client";

import { useTransition } from "react";
import { MailCheck } from "lucide-react";
import { adminVerifyEmailAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface Props {
    userId: string;
    emailVerified: boolean;
}

export function AdminVerifyEmailButton({ userId, emailVerified }: Props) {
    const [isPending, startTransition] = useTransition();

    if (emailVerified) return null;

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            title="ยืนยันอีเมลแทนนิสิต"
            className="h-7 w-7 p-0 rounded-lg text-orange-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-300"
            onClick={() =>
                startTransition(async () => {
                    const res = await adminVerifyEmailAction(userId);
                    if (res.error) alert(res.error);
                })
            }
        >
            <MailCheck className="h-3.5 w-3.5" />
            <span className="sr-only">ยืนยันอีเมล</span>
        </Button>
    );
}
