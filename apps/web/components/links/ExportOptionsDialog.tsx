"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@pingtome/ui";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

type ExportScope = "all" | "filtered" | "selected";
type ExportFormat = "csv" | "json";

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount?: number;
  filteredCount?: number;
  totalCount?: number;
  onExport: (options: {
    scope: ExportScope;
    format: ExportFormat;
    startDate?: Date;
    endDate?: Date;
  }) => void;
  isExporting?: boolean;
}

export function ExportOptionsDialog({
  open,
  onOpenChange,
  selectedCount = 0,
  filteredCount = 0,
  totalCount = 0,
  onExport,
  isExporting = false,
}: ExportOptionsDialogProps) {
  const t = useTranslations("links.export");
  const [scope, setScope] = React.useState<ExportScope>("all");
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("csv");
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();

  const handleExport = () => {
    onExport({
      scope,
      format: exportFormat,
      startDate,
      endDate,
    });
  };

  const getExportCount = () => {
    switch (scope) {
      case "selected":
        return selectedCount;
      case "filtered":
        return filteredCount;
      default:
        return totalCount;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("exportLinks")}</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {t("exportOptions")}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>{t("exportScope")}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="all"
                  name="scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="all"
                  className="font-normal cursor-pointer text-sm"
                >
                  {t("allLinks", { count: totalCount })}
                </Label>
              </div>
              {filteredCount > 0 && filteredCount !== totalCount && (
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="filtered"
                    name="scope"
                    value="filtered"
                    checked={scope === "filtered"}
                    onChange={(e) => setScope(e.target.value as ExportScope)}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="filtered"
                    className="font-normal cursor-pointer text-sm"
                  >
                    {t("filteredLinks", { count: filteredCount })}
                  </Label>
                </div>
              )}
              {selectedCount > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="selected"
                    name="scope"
                    value="selected"
                    checked={scope === "selected"}
                    onChange={(e) => setScope(e.target.value as ExportScope)}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="selected"
                    className="font-normal cursor-pointer text-sm"
                  >
                    {t("selectedLinks", { count: selectedCount })}
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("format")}</Label>
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t("dateRangeOptional")}</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : t("startDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : t("endDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                {t("clearDates")}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || getExportCount() === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("exporting")}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t("exportCount", { count: getExportCount() })}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
