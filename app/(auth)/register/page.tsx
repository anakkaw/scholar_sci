import { RegisterForm } from "@/components/auth/register-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex flex-col justify-center items-center p-4 py-12">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 text-amber-800 font-bold text-3xl">
                        <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center shadow-md">
                            <GraduationCap className="h-7 w-7 text-white" />
                        </div>
                        ScholarSci
                    </div>
                </div>

                <Card className="w-full shadow-xl border-0 ring-1 ring-amber-200">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight">ลงทะเบียนนิสิตทุน</CardTitle>
                        <CardDescription>
                            ต้องใช้อีเมลมหาวิทยาลัยนเรศวร (@nu.ac.th) เท่านั้น
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RegisterForm />
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-slate-500 dark:text-gray-400">
                        มีบัญชีอยู่แล้ว?{" "}
                        <Link
                            href="/login"
                            className="ml-1 text-primary hover:underline font-medium transition-colors"
                        >
                            เข้าสู่ระบบ
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
