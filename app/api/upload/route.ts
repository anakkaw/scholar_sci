import { NextRequest, NextResponse } from "next/server";
import { uploadFileToStorage } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { MAX_FILE_SIZE, MAX_IMAGE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/upload-utils";
import sharp from "sharp";

// Whitelist ของ folder ที่อนุญาต — ป้องกัน path traversal attack
const ALLOWED_FOLDERS = ["profiles", "achievements", "reports", "transcripts", "general"] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        // Ensure user is authenticated
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        // Sanitize folder: รับเฉพาะค่าที่อยู่ใน whitelist เท่านั้น
        const rawFolder = (formData.get("folder") as string) || "general";
        const folder: UploadFolder = (ALLOWED_FOLDERS as readonly string[]).includes(rawFolder)
            ? (rawFolder as UploadFolder)
            : "general";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate File Size: images up to 10MB, other files (PDF) up to 2MB
        const isImageUpload = file.type.startsWith("image/");
        const sizeLimit = isImageUpload ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
        const sizeLimitLabel = isImageUpload ? "10MB" : "2MB";
        if (file.size > sizeLimit) {
            return NextResponse.json(
                { error: `ขนาดไฟล์ต้องไม่เกิน ${sizeLimitLabel}` },
                { status: 400 }
            );
        }

        // Validate MIME type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only PDF, JPG, PNG, and WEBP are allowed." },
                { status: 400 }
            );
        }

        const rawBytes = new Uint8Array(await file.arrayBuffer());
        let mimeType = file.type;
        let buffer: Buffer;

        // Resize profile images to 400×400 WebP before upload
        const isImage = file.type.startsWith("image/");
        if (folder === "profiles" && isImage) {
            buffer = await sharp(rawBytes)
                .resize(400, 400, { fit: "cover", position: "centre" })
                .webp({ quality: 85 })
                .toBuffer();
            mimeType = "image/webp";
        } else {
            buffer = Buffer.from(rawBytes);
        }

        // Sanitize filename or use a generic name
        const ext = folder === "profiles" && isImage ? ".webp" : file.name.slice(file.name.lastIndexOf("."));
        const uniqueFilename = `${crypto.randomUUID()}${ext}`;

        // Path in Supabase bucket e.g. "profiles/user123/uuid.webp"
        const storagePath = `${folder}/${session.user.id}/${uniqueFilename}`;

        const uploadResult = await uploadFileToStorage(
            buffer,
            storagePath,
            mimeType
        );

        return NextResponse.json({
            url: uploadResult.url,
            path: uploadResult.path,
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
        }, { status: 201 });

    } catch (error) {
        console.error("Upload handler error:", error);
        return NextResponse.json(
            { error: "An error occurred while uploading the file" },
            { status: 500 }
        );
    }
}
