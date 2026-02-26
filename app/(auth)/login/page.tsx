import { LoginForm } from "@/components/auth/login-form";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

function LoginBgDecor() {
    return (
        <>
            {/* Top-right large circle cluster */}
            <svg
                className="absolute top-0 right-0 pointer-events-none"
                width="380" height="380"
                viewBox="0 0 380 380"
                fill="none"
                aria-hidden="true"
            >
                <circle cx="340" cy="40" r="200" fill="none" stroke="rgba(251,191,36,0.12)" strokeWidth="1.5" />
                <circle cx="340" cy="40" r="140" fill="none" stroke="rgba(251,191,36,0.10)" strokeWidth="1" />
                <circle cx="340" cy="40" r="80" fill="rgba(251,191,36,0.06)" stroke="rgba(251,191,36,0.15)" strokeWidth="1" />
                <circle cx="340" cy="40" r="30" fill="rgba(251,191,36,0.10)" />
                {/* Accent dots */}
                <circle cx="200" cy="100" r="4" fill="rgba(251,191,36,0.25)" />
                <circle cx="160" cy="60" r="3" fill="rgba(251,191,36,0.18)" />
                <circle cx="310" cy="160" r="5" fill="rgba(251,191,36,0.15)" />
                {/* Diamond */}
                <path d="M 240 80 l 8 -8 l 8 8 l -8 8 Z" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
            </svg>

            {/* Bottom-left decorations */}
            <svg
                className="absolute bottom-0 left-0 pointer-events-none"
                width="300" height="300"
                viewBox="0 0 300 300"
                fill="none"
                aria-hidden="true"
            >
                <circle cx="40" cy="280" r="160" fill="none" stroke="rgba(251,191,36,0.10)" strokeWidth="1.5" />
                <circle cx="40" cy="280" r="100" fill="none" stroke="rgba(251,191,36,0.08)" strokeWidth="1" />
                <circle cx="40" cy="280" r="50" fill="rgba(251,191,36,0.05)" />
                <circle cx="130" cy="220" r="4" fill="rgba(251,191,36,0.2)" />
                <circle cx="90" cy="180" r="3" fill="rgba(251,191,36,0.15)" />
                {/* Small diamond */}
                <path d="M 160 240 l 6 -6 l 6 6 l -6 6 Z" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="1" />
            </svg>

            {/* Center-left subtle dot grid */}
            <svg
                className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-30"
                width="80" height="120"
                viewBox="0 0 80 120"
                fill="none"
                aria-hidden="true"
            >
                {[0, 20, 40, 60, 80, 100].map(y =>
                    [0, 20, 40, 60].map(x => (
                        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="rgba(251,191,36,0.6)" />
                    ))
                )}
            </svg>
        </>
    );
}

function ScholarSciLogoBig() {
    return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" />
            <path d="M24 8L38 15.5V28.5L24 36L10 28.5V15.5L24 8Z" fill="rgba(251,191,36,0.25)" stroke="rgba(251,191,36,0.6)" strokeWidth="1.5" />
            <path d="M15 21L24 16L33 21V26L24 31L15 26V21Z" fill="rgba(251,191,36,0.5)" />
            <circle cx="24" cy="23.5" r="4.5" fill="white" opacity="0.9" />
            <path d="M24 19V14M24 33V28M19 23.5H14M34 23.5H29" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </svg>
    );
}

export default function LoginPage() {
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/60 flex flex-col justify-center items-center p-4 overflow-hidden">
            <LoginBgDecor />

            <div className="relative z-10 w-full max-w-sm">

                {/* Logo area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-300/40 mb-3">
                        <ScholarSciLogoBig />
                    </div>
                    <h1 className="text-2xl font-bold text-amber-900 tracking-tight">ScholarSci</h1>
                    <p className="text-amber-700/60 text-xs mt-0.5 tracking-wider uppercase font-medium">ระบบบริหารจัดการนิสิตทุน</p>
                </div>

                {/* Login Card */}
                <Card className="w-full shadow-2xl shadow-amber-200/30 border-0 ring-1 ring-amber-200/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl">
                    <CardHeader className="space-y-1 text-center pb-4">
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-gray-200">เข้าสู่ระบบ</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            จัดการประวัติและความก้าวหน้านิสิตทุน
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6">
                        <LoginForm />
                    </CardContent>
                    <CardFooter className="flex flex-col items-center px-6 pb-6 pt-2">
                        <div className="text-sm text-slate-500 dark:text-gray-400">
                            ยังไม่มีบัญชี?{" "}
                            <Link href="/register" className="text-amber-700 hover:text-amber-800 font-semibold hover:underline transition-colors">
                                ลงทะเบียน
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                {/* Footer note */}
                <p className="text-center text-[11px] text-amber-700/40 mt-6 tracking-wide">
                    © ScholarSci · ระบบบริหารจัดการนิสิตทุน
                </p>
            </div>
        </div>
    );
}
