import { SelectScholarshipForm } from "@/components/auth/select-scholarship-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { SessionProvider } from "next-auth/react";

export default function SelectScholarshipPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2 text-primary font-bold text-3xl">
                        <GraduationCap className="h-10 w-10" />
                        ScholarSci
                    </div>
                </div>

                <Card className="w-full shadow-lg border-0 ring-1 ring-slate-200">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">ข้อมูลเพิ่มเติม</CardTitle>
                        <CardDescription>
                            กรุณาระบุทุนการศึกษาของท่าน เพื่อใช้ในการตรวจสอบสิทธิ์
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* We need SessionProvider here so useSession inside SelectScholarshipForm works properly on a client component */}
                        <SessionProvider>
                            <SelectScholarshipForm />
                        </SessionProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
