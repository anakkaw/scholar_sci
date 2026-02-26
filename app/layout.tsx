import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
    subsets: ["thai", "latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "ScholarSci — ระบบบริหารนิสิตทุน",
    description: "ระบบบริหารจัดการนิสิตทุนสำหรับมหาวิทยาลัย รองรับการรายงานความก้าวหน้าทุกภาคเรียน",
    keywords: "scholarship, student, university, ทุนการศึกษา, นิสิต",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th" suppressHydrationWarning>
            <body className={`${sarabun.variable} ${sarabun.className} min-h-screen bg-gray-50`}>{children}</body>
        </html>
    );
}
