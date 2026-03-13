"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
    label: string;
    sortKey: string;
    className?: string;
}

export function SortableHeader({ label, sortKey, className = "" }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort");
    const currentDir = searchParams.get("dir");

    const isActive = currentSort === sortKey;
    const isAsc = isActive && currentDir === "asc";

    const handleClick = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (isActive && isAsc) {
            params.set("sort", sortKey);
            params.set("dir", "desc");
        } else {
            params.set("sort", sortKey);
            params.set("dir", "asc");
        }
        router.push(`/admin/users?${params.toString()}`);
    };

    const Icon = isActive ? (isAsc ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-1 text-xs font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors ${
                isActive ? "text-amber-700 dark:text-amber-400" : "text-slate-500 dark:text-gray-400"
            } ${className}`}
        >
            {label}
            <Icon className="h-3 w-3" />
        </button>
    );
}
