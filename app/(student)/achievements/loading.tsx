import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AchievementsLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-9 w-36" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-72 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
