import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/60 flex flex-col justify-center items-center p-4 overflow-hidden">

            {/* Background decor (reuse login style) */}
            <svg className="absolute top-0 right-0 pointer-events-none" width="300" height="300" viewBox="0 0 300 300" fill="none" aria-hidden="true">
                <circle cx="260" cy="40" r="160" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="1.5" />
                <circle cx="260" cy="40" r="100" fill="none" stroke="rgba(251,191,36,0.10)" strokeWidth="1" />
                <circle cx="260" cy="40" r="50" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.15)" strokeWidth="1" />
            </svg>
            <svg className="absolute bottom-0 left-0 pointer-events-none" width="240" height="240" viewBox="0 0 240 240" fill="none" aria-hidden="true">
                <circle cx="40" cy="220" r="130" fill="none" stroke="rgba(251,191,36,0.10)" strokeWidth="1.5" />
                <circle cx="40" cy="220" r="80" fill="none" stroke="rgba(251,191,36,0.08)" strokeWidth="1" />
            </svg>

            <div className="relative z-10 w-full max-w-sm">

                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-300/40 mb-3">
                        <KeyRound className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-amber-900 tracking-tight">ScholarSci</h1>
                    <p className="text-amber-700/60 text-xs mt-0.5 tracking-wider uppercase font-medium">ระบบบริหารจัดการนิสิตทุน</p>
                </div>

                <Card className="w-full shadow-2xl shadow-amber-200/30 border-0 ring-1 ring-amber-200/80 bg-white/90 backdrop-blur-sm rounded-2xl">
                    <CardHeader className="space-y-1 text-center pb-4">
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-800">ลืมรหัสผ่าน</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            รีเซ็ตรหัสผ่านผ่านอีเมลที่ลงทะเบียนไว้
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <ForgotPasswordForm />
                    </CardContent>
                </Card>

                <p className="text-center text-[11px] text-amber-700/40 mt-6 tracking-wide">
                    © ScholarSci · ระบบบริหารจัดการนิสิตทุน
                </p>
            </div>
        </div>
    );
}
