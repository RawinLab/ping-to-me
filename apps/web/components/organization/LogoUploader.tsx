"use client";

import { useState, useRef, useCallback } from "react";
import { Button, cn } from "@pingtome/ui";
import { Upload, X, Image, Loader2 } from "lucide-react";
import {
  uploadOrganizationLogo,
  deleteOrganizationLogo,
} from "@/lib/api/organizations";

interface LogoUploaderProps {
  orgId: string;
  currentLogo?: string;
  onUploadSuccess?: (logoUrl: string) => void;
  onDeleteSuccess?: () => void;
  className?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function LogoUploader({
  orgId,
  currentLogo,
  onUploadSuccess,
  onDeleteSuccess,
  className,
}: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PNG, JPEG, or WebP image";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 2MB";
    }
    return null;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const result = await uploadOrganizationLogo(orgId, file);
        setPreview(result.logoUrl);
        onUploadSuccess?.(result.logoUrl);
      } catch (err: any) {
        setError(err.message || "Failed to upload logo");
        setPreview(currentLogo || null);
      } finally {
        setIsUploading(false);
      }
    },
    [orgId, currentLogo, onUploadSuccess],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFile],
  );

  const handleDelete = async () => {
    if (!preview || !confirm("Are you sure you want to remove the logo?"))
      return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteOrganizationLogo(orgId);
      setPreview(null);
      onDeleteSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to delete logo");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50",
          (isUploading || isDeleting) && "pointer-events-none opacity-50",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt="Organization logo"
                className="w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-lg"
              />
              {(isUploading || isDeleting) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
              ) : (
                <Image className="h-8 w-8 text-slate-400" />
              )}
            </div>
          )}

          <div className="text-center">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Upload className="h-4 w-4" />
              <span>
                {isDragging
                  ? "Drop image here"
                  : preview
                    ? "Click or drag to replace"
                    : "Click or drag to upload"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPEG, or WebP up to 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Delete button */}
      {preview && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={isDeleting}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          Remove Logo
        </Button>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
