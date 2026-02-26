import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client lazily to avoid build-time errors when env vars are not present
let _supabaseStorage: ReturnType<typeof createClient> | null = null;

function getSupabaseStorage() {
    if (!_supabaseStorage) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
        }
        _supabaseStorage = createClient(url, key);
    }
    return _supabaseStorage;
}

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
        const client = getSupabaseStorage();
        const { data, error } = await client.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (error) {
            console.error("Supabase upload error:", error);
            throw error;
        }

        const { data: publicUrlData } = client.storage
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

