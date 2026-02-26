import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const activeScholarships = await prisma.scholarship.findMany({
            where: {
                active: true,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(activeScholarships);
    } catch (error) {
        console.error("Error fetching active scholarships:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
