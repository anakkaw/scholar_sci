import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminUsersLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Skeleton className="h-9 w-72" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-80 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-9 w-64 mb-4" />
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
