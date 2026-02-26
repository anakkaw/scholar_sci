import { verifyEmailAction } from "@/actions/verify-email";
import { GraduationCap, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default async function VerifyEmailPage(
    props: { searchParams?: Promise<{ token?: string }> }
) {
    const searchParams = await props.searchParams;
    const token = searchParams?.token ?? "";

    const result = await verifyEmailAction(token);

    const isSuccess = !!result.success;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex flex-col justify-center items-center p-4">
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
                    <CardHeader className="space-y-2 text-center">
                        <div className="flex justify-center mb-2">
                            {isSuccess ? (
                                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                            ) : (
                                <XCircle className="h-14 w-14 text-red-500" />
                            )}
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            {isSuccess ? "ยืนยันอีเมลสำเร็จ" : "ยืนยันอีเมลไม่สำเร็จ"}
                        </CardTitle>
                        <CardDescription>
                            {isSuccess ? result.success : result.error}
                        </CardDescription>
                    </CardHeader>

                    <CardContent />

                    <CardFooter className="flex flex-col gap-3">
                        {isSuccess ? (
                            <Button asChild className="w-full bg-amber-700 hover:bg-amber-800">
                                <Link href="/login">เข้าสู่ระบบ</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/register">ลงทะเบียนใหม่</Link>
                                </Button>
                                <p className="text-xs text-center text-slate-400">
                                    หากพบปัญหา กรุณาติดต่อผู้ดูแลระบบ
                                </p>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
