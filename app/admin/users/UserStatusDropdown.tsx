"use client";

import { useOptimistic, useTransition } from "react";
import { UserStatus } from "@prisma/client";
import { MoreHorizontal, CheckCircle, XCircle, Slash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateUserStatusAction } from "@/actions/admin";

export function UserStatusDropdown({ userId, currentStatus }: { userId: string; currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

    const handleStatusChange = (status: UserStatus) => {
        if (status === optimisticStatus) return;
        startTransition(async () => {
            setOptimisticStatus(status);
            const res = await updateUserStatusAction(userId, status);
            if (res.error) alert(res.error);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>เปลี่ยนสถานะ</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {optimisticStatus !== "APPROVED" && (
                    <DropdownMenuItem onClick={() => handleStatusChange("APPROVED")} className="text-green-600 focus:text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> อนุมัติการใช้งาน
                    </DropdownMenuItem>
                )}
                {optimisticStatus !== "REJECTED" && (
                    <DropdownMenuItem onClick={() => handleStatusChange("REJECTED")} className="text-red-600 focus:text-red-700">
                        <XCircle className="h-4 w-4 mr-2" /> ปฏิเสธการเข้าใช้งาน
                    </DropdownMenuItem>
                )}
                {optimisticStatus !== "SUSPENDED" && (
                    <DropdownMenuItem onClick={() => handleStatusChange("SUSPENDED")} className="text-orange-600 focus:text-orange-700">
                        <Slash className="h-4 w-4 mr-2" /> ระงับการใช้งานชั่วคราว
                    </DropdownMenuItem>
                )}
                {optimisticStatus !== "PENDING" && (
                    <DropdownMenuItem onClick={() => handleStatusChange("PENDING")} className="text-slate-600 dark:text-gray-300 focus:text-slate-700">
                        <RefreshCw className="h-4 w-4 mr-2" /> คืนสถานะรอพิจารณา
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
