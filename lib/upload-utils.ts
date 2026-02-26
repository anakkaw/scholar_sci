export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB (resized server-side)
export const MAX_FILE_SIZE  =  2 * 1024 * 1024; // 2MB  (PDF, no resize)

export const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
];

/**
 * Validates a file before upload.
 * Images are allowed up to 10MB (server resizes to 400×400 WebP).
 * Other files (PDF) are limited to 2MB.
 * @param file The file object from input type="file"
 * @returns An error message string if invalid, or null if valid.
 */
export const validateFile = (file: File): string | null => {
    if (!file) {
        return "กรุณาเลือกไฟล์";
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return "รองรับเฉพาะไฟล์ PDF, JPG, PNG, และ WEBP เท่านั้น";
    }

    const isImage = file.type.startsWith("image/");
    const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    const limitLabel = isImage ? "10MB" : "2MB";

    if (file.size > limit) {
        return `ขนาดไฟล์ต้องไม่เกิน ${limitLabel}`;
    }

    return null;
};

