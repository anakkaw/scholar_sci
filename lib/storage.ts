import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for storage
// We use the service role key to bypass RLS policies for admin-level uploads
// Make sure your bucket is set to "Public" if you want users to download via URL directly
export const supabaseStorage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Uploads a file buffer to Supabase Storage
 * @param buffer The file buffer to upload
 * @param path The path including filename in the bucket (e.g. "achievements/user123_uuid.pdf")
 * @param mimeType The file's MIME type
 * @param bucketName The storage bucket name (default is "scholarsci")
 * @returns An object containing the public URL or an error
 */
export async function uploadFileToStorage(
    buffer: Buffer,
    path: string,
    mimeType: string,
    bucketName: string = "scholarsci"
) {
    try {
        const { data, error } = await supabaseStorage.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (error) {
            console.error("Supabase upload error:", error);
            throw error;
        }

        const { data: publicUrlData } = supabaseStorage.storage
            .from(bucketName)
            .getPublicUrl(path);

        return {
            url: publicUrlData.publicUrl,
            path: data.path,
        };
    } catch (error) {
        console.error("Error in uploadFileToStorage:", error);
        throw error;
    }
}

