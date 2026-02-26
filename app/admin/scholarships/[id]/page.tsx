import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScholarshipForm } from "./ScholarshipForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminScholarshipEditPage(
    props: {
        params?: Promise<{ id?: string }>;
    }
) {
    const params = await props.params;

    const isNew = params?.id === "new";
    let scholarship = null;

    if (!isNew && params?.id) {
        scholarship = await prisma.scholarship.findUnique({
            where: { id: params?.id as string },
            include: {
                milestones: { orderBy: [{ targetYearLevel: "asc" }, { orderIndex: "asc" }] },
            }
        });

        if (!scholarship) {
            redirect("/admin/scholarships");
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/scholarships"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isNew ? "สร้างทุนการศึกษาใหม่" : "แก้ไขทุนการศึกษา"}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        ระบุรายละเอียดและเงื่อนไขการประเมินต่างๆ
                    </p>
                </div>
            </div>

            <ScholarshipForm initialData={scholarship} scholarshipId={isNew ? null : (params?.id || "")} />
        </div>
    );
}
