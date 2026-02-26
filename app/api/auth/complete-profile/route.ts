import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as z from "zod";

const CompleteProfileSchema = z.object({
    fullName: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
    scholarshipId: z.string().min(1, "กรุณาเลือกทุนการศึกษา"),
});

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedFields = CompleteProfileSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }

        const { fullName, scholarshipId } = validatedFields.data;

        // Check if user already has a profile (to prevent overwriting active students)
        const existingProfile = await prisma.studentProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (existingProfile) {
            return NextResponse.json({ error: "คุณมีประวัติในระบบแล้ว" }, { status: 400 });
        }

        // Create the profile and keep the status as PENDING
        await prisma.$transaction(async (tx) => {
            await tx.studentProfile.create({
                data: {
                    userId: session.user.id,
                    fullName,
                    scholarshipId,
                }
            });

            // Ensure their account is set to PENDING (it likely is already from OAuth creation)
            await tx.user.update({
                where: { id: session.user.id },
                data: { status: "PENDING" }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Complete profile error:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
    }
}
