import { useCallback } from "react";
import type { UseFormSetValue } from "react-hook-form";

type UploadFieldMap = {
    url: string;
    name: string;
    size: string;
    type: string;
};

/**
 * Reusable file upload hook for form components.
 * Handles the upload fetch and sets form values automatically.
 */
export function useFileUpload(
    folder: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: UseFormSetValue<any>,
    fields: UploadFieldMap
) {
    return useCallback(
        async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setValue(fields.url, data.url, { shouldDirty: true });
            setValue(fields.name, data.originalName, { shouldDirty: true });
            setValue(fields.size, data.size, { shouldDirty: true });
            setValue(fields.type, data.mimeType, { shouldDirty: true });
        },
        [folder, setValue, fields]
    );
}
