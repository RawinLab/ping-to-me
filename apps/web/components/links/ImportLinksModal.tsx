"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
} from "@pingtome/ui";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ImportLinksModalProps {
  children: React.ReactNode;
  onSuccess: () => void;
}

export function ImportLinksModal({
  children,
  onSuccess,
}: ImportLinksModalProps) {
  const t = useTranslations("links.import");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setResult(null);
      } else {
        alert(t("pleaseDropCsv"));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setResult(data);
      if (data.success > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import failed", error);
      alert(t("importFailed"));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/import/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to download template");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "import-template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Template download failed", error);
      alert(t("failedDownloadTemplate"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("importLinksCsv")}</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-2 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
            >
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <Label
                  htmlFor="file"
                  className="cursor-pointer text-primary hover:underline"
                >
                  {isDragging ? t("dropCsvHere") : t("chooseCsv")}
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {file ? file.name : t("noFileSelected")}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                {t("needTemplate")}{" "}
                <button
                  onClick={downloadTemplate}
                  className="text-primary hover:underline"
                >
                  {t("downloadCsvTemplate")}
                </button>
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? t("importing") : t("importLinks")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t("importCompleted")}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-xs text-muted-foreground">{t("total")}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {result.success}
                </div>
                <div className="text-xs text-muted-foreground">{t("success")}</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {result.failed}
                </div>
                <div className="text-xs text-muted-foreground">{t("failed")}</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-1">
                {result.errors.map((err: any, i: number) => (
                  <div key={i} className="text-red-600">
                    {t("row")} {i + 1}: {err.error}
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => {
                setOpen(false);
                setResult(null);
                setFile(null);
              }}
              className="w-full"
            >
              {t("done")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
