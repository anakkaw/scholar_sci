"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserPlus, Loader2 } from "lucide-react";
import { createAdminAction } from "@/actions/admin";

const CreateAdminSchema = z.object({
    email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

type CreateAdminValues = z.infer<typeof CreateAdminSchema>;

export function CreateAdminForm() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const form = useForm<CreateAdminValues>({
        resolver: zodResolver(CreateAdminSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = (values: CreateAdminValues) => {
        setMessage(null);
        startTransition(async () => {
            const result = await createAdminAction(values.email, values.password);
            if (result.success) {
                setMessage({ type: "success", text: result.success });
                form.reset();
                setTimeout(() => setOpen(false), 1500);
            } else {
                setMessage({ type: "error", text: result.error ?? "เกิดข้อผิดพลาด" });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { form.reset(); setMessage(null); } }}>
            <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800">
                    <UserPlus className="mr-2 h-4 w-4" />
                    เพิ่ม Admin ใหม่
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>เพิ่มบัญชีผู้ดูแลระบบใหม่</DialogTitle>
                    <DialogDescription>
                        สร้างบัญชี Admin ใหม่สำหรับระบบ ScholarSci
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>อีเมล</FormLabel>
                                    <FormControl>
                                        <Input placeholder="admin@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รหัสผ่าน</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {message && (
                            <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                {message.text}
                            </p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={isPending} className="bg-amber-700 hover:bg-amber-800">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                สร้างบัญชี Admin
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
