import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileLoading() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
            <Skeleton className="h-9 w-56" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-80 mt-1" />
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-9 w-24 mt-4" />
                </CardContent>
            </Card>
        </div>
    );
}
