"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
    Menu,
    LogOut,
    User,
    Sun,
    Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

interface AppLayoutProps {
    children: React.ReactNode;
    navItems: NavItem[];
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

function ScholarSciLogo() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" stroke="rgba(253,230,138,0.6)" strokeWidth="1" />
            <path d="M14 4L24 9.5V18.5L14 24L4 18.5V9.5L14 4Z" fill="rgba(251,191,36,0.25)" stroke="rgba(253,230,138,0.8)" strokeWidth="1" />
            <path d="M7 12.5L14 8.5L21 12.5V15.5L14 19.5L7 15.5V12.5Z" fill="rgba(251,191,36,0.4)" />
            <circle cx="14" cy="14" r="3" fill="rgba(253,230,138,0.9)" />
            <path d="M14 11V8M14 20V17M11 14H8M20 14H17" stroke="rgba(253,230,138,0.7)" strokeWidth="1" strokeLinecap="round" />
        </svg>
    );
}

function SidebarPattern() {
    return (
        <svg
            className="absolute inset-0 w-full h-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <pattern id="sidebar-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="rgba(253,230,138,0.8)" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sidebar-dots)" />
        </svg>
    );
}

function SidebarHeaderDecor() {
    return (
        <svg
            className="absolute right-0 top-0 h-full opacity-20 pointer-events-none"
            width="120" height="60"
            viewBox="0 0 120 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="100" cy="10" r="40" stroke="rgba(253,230,138,0.6)" strokeWidth="1" fill="none" />
            <circle cx="110" cy="50" r="25" stroke="rgba(253,230,138,0.4)" strokeWidth="1" fill="none" />
            <circle cx="80" cy="5" r="15" stroke="rgba(253,230,138,0.3)" strokeWidth="1" fill="none" />
        </svg>
    );
}

function NavDotIndicator() {
    return (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 opacity-80" />
    );
}

export function AppLayout({ children, navItems, user }: AppLayoutProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => setMounted(true), []);

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-white dark:bg-gray-900">
            {/* Logo Header */}
            <div className="relative flex h-14 items-center border-b border-amber-600/40 px-5 lg:h-[60px] overflow-hidden bg-gradient-to-r from-amber-800 to-amber-600">
                <SidebarHeaderDecor />
                <Link href="/" className="relative flex items-center gap-2.5 font-semibold text-white z-10">
                    <ScholarSciLogo />
                    <div className="flex flex-col leading-tight">
                        <span className="text-base font-bold tracking-wide">ScholarSci</span>
                        <span className="text-[10px] text-amber-200/80 font-normal tracking-wider uppercase">ระบบบริหารนิสิตทุน</span>
                    </div>
                </Link>
            </div>

            {/* Nav section label */}
            <div className="px-5 pt-5 pb-1">
                <p className="text-[10px] font-semibold tracking-widest text-amber-600/60 dark:text-amber-400/60 uppercase">เมนูหลัก</p>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto py-1">
                <nav className="grid items-start px-3 text-sm font-medium space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 relative",
                                    isActive
                                        ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 font-semibold shadow-sm dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-100"
                                        : "text-amber-900/60 hover:bg-amber-50/80 hover:text-amber-800 dark:text-amber-200/60 dark:hover:bg-amber-900/30 dark:hover:text-amber-200"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-amber-500" />
                                )}
                                <span className={cn(
                                    "transition-colors",
                                    isActive ? "text-amber-600 dark:text-amber-400" : "text-amber-400 group-hover:text-amber-600 dark:text-amber-500 dark:group-hover:text-amber-400"
                                )}>
                                    {item.icon}
                                </span>
                                <span className="flex-1 truncate">{item.title}</span>
                                {(item.badge ?? 0) > 0 && (
                                    <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                                        {item.badge! > 99 ? "99+" : item.badge}
                                    </span>
                                )}
                                {isActive && <NavDotIndicator />}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Decorative divider with SVG */}
            <div className="px-5 py-2">
                <div className="relative h-px bg-amber-100 dark:bg-gray-700">
                    <svg className="absolute left-1/2 -translate-x-1/2 -top-2" width="16" height="4" viewBox="0 0 16 4" fill="none">
                        <circle cx="2" cy="2" r="1.5" fill="#fbbf24" opacity="0.6" />
                        <circle cx="8" cy="2" r="1.5" fill="#fbbf24" opacity="0.8" />
                        <circle cx="14" cy="2" r="1.5" fill="#fbbf24" opacity="0.6" />
                    </svg>
                </div>
            </div>

            {/* User info at bottom */}
            <div className="p-4 pb-3">
                <div className="relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-3 py-2.5 overflow-hidden dark:from-gray-800 dark:to-gray-800 dark:border-gray-700">
                    {/* subtle pattern */}
                    <div className="absolute right-0 top-0 opacity-20">
                        <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
                            <circle cx="40" cy="5" r="20" stroke="#fbbf24" strokeWidth="1" fill="none" />
                            <circle cx="45" cy="35" r="15" stroke="#fbbf24" strokeWidth="1" fill="none" />
                        </svg>
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-amber-200 ring-2 ring-amber-100 flex-shrink-0 relative z-10 dark:border-amber-700 dark:ring-amber-900/50">
                        <AvatarImage src={user.image || ""} alt="Avatar" />
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-900 dark:text-amber-300">
                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden relative z-10 flex-1 min-w-0">
                        <span className="text-xs font-semibold truncate text-amber-900 dark:text-amber-100">{user.name || "ผู้ใช้งาน"}</span>
                        <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 truncate">
                            {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "นิสิตทุน"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Version & Credit */}
            <div className="px-4 pb-4 text-center">
                <p className="text-[10px] text-amber-400/60 dark:text-amber-500/50 leading-relaxed">
                    พัฒนาโดยงานบริการการศึกษา<br />
                    คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร
                </p>
                <p className="text-[10px] text-amber-300/40 dark:text-amber-600/40 mt-0.5">v1.0.0</p>
            </div>
        </div>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
            {/* Desktop Sidebar */}
            <div className="hidden border-r border-amber-100 dark:border-gray-700 bg-white dark:bg-gray-900 md:block relative overflow-hidden">
                {/* Subtle dot pattern across full sidebar */}
                <div className="absolute inset-0 pointer-events-none">
                    <SidebarPattern />
                </div>
                <div className="relative z-10 h-full">
                    <SidebarContent />
                </div>
            </div>

            <div className="flex flex-col min-w-0">
                {/* Top Header */}
                <header className="flex h-14 items-center gap-4 border-b border-amber-100/80 dark:border-gray-700/80 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
                    {/* Mobile menu button */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden border-amber-200 hover:bg-amber-50 dark:border-gray-600 dark:hover:bg-gray-800 rounded-xl"
                            >
                                <Menu className="h-4 w-4" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 border-amber-100 dark:border-gray-700">
                            <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>

                    {/* Breadcrumb / page context (flexible) */}
                    <div className="flex-1 flex items-center gap-2">
                        {/* SVG decorative dot accent on header */}
                        <div className="hidden md:flex items-center gap-1.5 opacity-30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="w-1 h-1 rounded-full bg-amber-300" />
                        </div>
                    </div>

                    {/* Dark mode toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full ring-2 ring-amber-100 hover:ring-amber-200 dark:ring-gray-700 dark:hover:ring-gray-600 transition-all"
                    >
                        {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* User dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-amber-100 hover:ring-amber-200 dark:ring-gray-700 dark:hover:ring-gray-600 transition-all">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.image || ""} alt="Avatar" />
                                    <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold dark:bg-amber-900 dark:text-amber-300">
                                        {user.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-amber-100 dark:border-gray-700 shadow-lg">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex items-center gap-2.5 py-1">
                                    <Avatar className="h-8 w-8 border border-amber-200 dark:border-amber-700">
                                        <AvatarImage src={user.image || ""} alt="Avatar" />
                                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-900 dark:text-amber-300">
                                            {user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <p className="text-sm font-semibold leading-tight">{user.name}</p>
                                        <p className="text-xs leading-tight text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-amber-50 dark:bg-gray-700" />
                            <DropdownMenuItem asChild className="rounded-lg focus:bg-amber-50 focus:text-amber-900 dark:focus:bg-amber-900/30 dark:focus:text-amber-100 cursor-pointer">
                                <Link href={user.role === "ADMIN" ? "/admin/settings" : "/profile"}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>ข้อมูลส่วนตัว</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-amber-50 dark:bg-gray-700" />
                            <DropdownMenuItem
                                className="rounded-lg text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/30 dark:focus:text-red-400 cursor-pointer"
                                onClick={() => signOut()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>ออกจากระบบ</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                {/* Main Content */}
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 min-h-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
