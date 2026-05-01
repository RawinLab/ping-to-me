"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Alert,
  AlertDescription,
} from "@pingtome/ui";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

interface PreviewRow {
  rowNumber: number;
  data: {
    originalUrl: string;
    slug?: string;
    title?: string;
    description?: string;
    tags?: string[];
  };
  errors: string[];
  warnings: string[];
}

interface ImportPreviewData {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: PreviewRow[];
  duplicateSlugs: string[];
}

interface ImportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: ImportPreviewData | null;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export function ImportPreviewModal({
  open,
  onOpenChange,
  previewData,
  onConfirm,
  onCancel,
  isImporting = false,
}: ImportPreviewModalProps) {
  const t = useTranslations("links.importPreview");
  if (!previewData) return null;

  const { totalRows, validRows, invalidRows, preview, duplicateSlugs } = previewData;
  const hasErrors = invalidRows > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("importPreview")}</DialogTitle>
          <DialogDescription>
            {t("importPreviewDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">{t("totalRows")}:</span>
            <span className="font-semibold">{totalRows}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">{t("valid")}:</span>
            <span className="font-semibold text-green-600">{validRows}</span>
          </div>
          {invalidRows > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">{t("invalid")}:</span>
              <span className="font-semibold text-red-600">{invalidRows}</span>
            </div>
          )}
        </div>

        {duplicateSlugs.length > 0 && (
          <Alert className="mb-4 border-yellow-500/50 text-yellow-800 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription>
              {t("duplicateSlugs", { slugs: duplicateSlugs.join(", ") })}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("row")}</TableHead>
                <TableHead className="w-16">{t("status")}</TableHead>
                <TableHead>{t("url")}</TableHead>
                <TableHead>{t("slug")}</TableHead>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("tags")}</TableHead>
                <TableHead>{t("issues")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row) => (
                <TableRow
                  key={row.rowNumber}
                  className={row.errors.length > 0 ? "bg-red-50 dark:bg-red-950/20" : ""}
                >
                  <TableCell className="font-mono text-sm">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell>
                    {row.errors.length > 0 ? (
                      <Badge variant="destructive">{t("status")}</Badge>
                    ) : row.warnings.length > 0 ? (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-950 dark:text-yellow-400">
                        {t("warning")}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-950 dark:text-green-400">
                        {t("valid")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {row.data.originalUrl}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.data.slug || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {row.data.title || "-"}
                  </TableCell>
                  <TableCell>
                    {row.data.tags?.length ? (
                      <div className="flex gap-1 flex-wrap">
                        {row.data.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {row.data.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{row.data.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {row.errors.length > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {row.errors.join("; ")}
                      </div>
                    )}
                    {row.warnings.length > 0 && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        {row.warnings.join("; ")}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalRows > 10 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t("showingRows", { total: totalRows })}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isImporting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={validRows === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("importing")}
              </>
            ) : (
              <>{t("importCount", { count: validRows })}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
