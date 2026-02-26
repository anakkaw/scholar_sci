"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function UserSearchInput({ defaultValue }: { defaultValue: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const params = new URLSearchParams(searchParams.toString());
            const value = e.target.value;
            if (value) {
                params.set("q", value);
            } else {
                params.delete("q");
            }
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        },
        [router, pathname, searchParams]
    );

    return (
        <div className="relative flex-1">
            <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${isPending ? "text-amber-500 animate-pulse" : "text-muted-foreground"}`} />
            <Input
                type="search"
                placeholder="ค้นหาชื่อ, รหัสนิสิต, อีเมล..."
                className="pl-8"
                defaultValue={defaultValue}
                onChange={handleChange}
            />
        </div>
    );
}
