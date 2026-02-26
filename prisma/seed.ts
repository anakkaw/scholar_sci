import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // ── Admin user ──────────────────────────────────────────────────────────────
    const adminPasswordHash = await bcrypt.hash("Admin@1234", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@scholarsci.ac.th" },
        update: { emailVerified: new Date() },
        create: {
            email: "admin@scholarsci.ac.th",
            passwordHash: adminPasswordHash,
            role: "ADMIN",
            status: "APPROVED",
            emailVerified: new Date(),
        },
    });
    console.log("✅ Admin created:", admin.email);

    // ── Scholarships ────────────────────────────────────────────────────────────
    const scholarship1 = await prisma.scholarship.upsert({
        where: { id: "sc_royal_project" },
        update: {},
        create: {
            id: "sc_royal_project",
            name: "ทุนโครงการหลวง",
            description:
                "ทุนสนับสนุนนิสิตที่มีความสามารถด้านวิชาการและมีจิตอาสา เพื่อพัฒนาชุมชนและสังคม",
            active: true,
        },
    });

    const scholarship2 = await prisma.scholarship.upsert({
        where: { id: "sc_stem_excellence" },
        update: {},
        create: {
            id: "sc_stem_excellence",
            name: "ทุนความเป็นเลิศด้าน STEM",
            description:
                "ทุนสำหรับนิสิตที่มีผลการเรียนดีเด่นด้านวิทยาศาสตร์ เทคโนโลยี วิศวกรรม และคณิตศาสตร์",
            active: true,
        },
    });

    const scholarship3 = await prisma.scholarship.upsert({
        where: { id: "sc_community_dev" },
        update: {},
        create: {
            id: "sc_community_dev",
            name: "ทุนพัฒนาชุมชนท้องถิ่น",
            description:
                "ทุนสำหรับนิสิตที่มีภูมิลำเนาในพื้นที่ห่างไกล และมีความตั้งใจในการพัฒนาชุมชน",
            active: true,
        },
    });

    console.log("✅ Scholarships created:", 3);


    // ── Sample document ─────────────────────────────────────────────────────────
    await prisma.document.createMany({
        skipDuplicates: true,
        data: [
            {
                id: "doc_handbook",
                title: "คู่มือนิสิตทุน ประจำปีการศึกษา 2567",
                category: "คู่มือ",
                scholarshipScope: "ALL",
                fileUrl: "https://example.com/placeholder-handbook.pdf",
                fileName: "student-handbook-2567.pdf",
                fileSizeBytes: 512000,
                mimeType: "application/pdf",
                isPublished: true,
                uploadedById: admin.id,
            },
            {
                id: "doc_report_form",
                title: "แบบฟอร์มรายงานความก้าวหน้า (PDF)",
                category: "แบบฟอร์ม",
                scholarshipScope: "ALL",
                fileUrl: "https://example.com/placeholder-form.pdf",
                fileName: "progress-report-form.pdf",
                fileSizeBytes: 128000,
                mimeType: "application/pdf",
                isPublished: true,
                uploadedById: admin.id,
            },
        ],
    });

    console.log("✅ Documents created");
    console.log("🎉 Seed completed successfully!");
    console.log("");
    console.log("Admin credentials:");
    console.log("  Email:    admin@scholarsci.ac.th");
    console.log("  Password: Admin@1234");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
