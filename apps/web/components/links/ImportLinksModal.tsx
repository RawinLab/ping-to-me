"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // apiRequest helper might assume JSON, so we use fetch directly or adjust helper
      // Assuming apiRequest handles FormData if body is FormData, but standard fetch is safer here
      const token = localStorage.getItem("token"); // Or get from auth hook
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/links/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setResult(data);
      if (data.success > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import failed", error);
      alert("Import failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,originalUrl,slug,title,tags\nhttps://example.com,example,Example Title,tag1|tag2";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Links from CSV</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-2">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <Label
                  htmlFor="file"
                  className="cursor-pointer text-primary hover:underline"
                >
                  Choose CSV file
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {file ? file.name : "No file selected"}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Need a template?{" "}
                <button
                  onClick={downloadTemplate}
                  className="text-primary hover:underline"
                >
                  Download CSV Template
                </button>
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Importing..." : "Import Links"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Import Completed</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {result.success}
                </div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {result.failed}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-1">
                {result.errors.map((err: any, i: number) => (
                  <div key={i} className="text-red-600">
                    Row {i + 1}: {err.error}
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
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
