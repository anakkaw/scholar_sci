import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-9 w-44" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-4 w-80 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-36 w-full rounded-lg" />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
