"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateFile } from "@/lib/upload-utils";
import { formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    accept?: string;
    disabled?: boolean;
    className?: string;
    currentFileName?: string;
    currentFileUrl?: string;
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
}

export function FileUpload({ onUpload, accept, disabled, className, currentFileName, currentFileUrl }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFile = async (file: File) => {
        setError(null);
        const validationError = validateFile(file);
        if (validationError) { setError(validationError); return; }
        setSelectedFile(file);
        setUploading(true);
        setProgress(30);
        try {
            await onUpload(file);
            setProgress(100);
            setTimeout(() => setProgress(0), 800);
        } catch (e: any) {
            setError(e.message ?? "อัปโหลดไม่สำเร็จ");
            setSelectedFile(null);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                    dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/50",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
                onClick={() => !disabled && inputRef.current?.click()}
            >
                <Upload className={cn("w-8 h-8 mx-auto mb-2 transition-colors", dragging ? "text-blue-500" : "text-gray-400")} />
                <p className="text-sm font-medium text-gray-700">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                <p className="text-xs text-gray-500 mt-1">รูปภาพสูงสุด 10MB · PDF สูงสุด 2MB</p>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept ?? ".pdf,.png,.jpg,.jpeg,.webp"}
                    disabled={disabled}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
            </div>

            {/* Progress bar */}
            {uploading && (
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Selected file preview */}
            {selectedFile && !uploading && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    {getFileIcon(selectedFile.type)}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedFile(null)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Current file */}
            {currentFileName && !selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{currentFileName}</p>
                    </div>
                    {currentFileUrl && (
                        <a href={currentFileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">
                            ดูไฟล์
                        </a>
                    )}
                </div>
            )}

            {/* Error */}
            {error && <p className="text-sm text-red-600 flex items-center gap-1"><X className="w-4 h-4" />{error}</p>}
        </div>
    );
}
