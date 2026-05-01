"use client";

import { LinksTable, LinksTableRef } from "@/components/links/LinksTable";
import { DateFilterModal } from "@/components/links/DateFilterModal";
import { FiltersModal, FilterValues } from "@/components/links/FiltersModal";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "@pingtome/ui";
import Link from "next/link";
import {
  Plus,
  Search,
  Calendar,
  SlidersHorizontal,
  List,
  Table2,
  LayoutGrid,
  Download,
  Upload,
  X,
} from "lucide-react";
import { ImportLinksModal } from "@/components/links/ImportLinksModal";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGate } from "@/components/PermissionGate";
import { useTranslations } from "next-intl";

export default function LinksPage() {
  const t = useTranslations("links.table");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "table" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalLinksCount, setTotalLinksCount] = useState(0);
  const linksTableRef = useRef<LinksTableRef>(null);

  // Permission checks
  const { canCreateLink, canExportLinks, canBulkLinks, role } = usePermission();

  // Filter modals state
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  // Filter values
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [tagFilters, setTagFilters] = useState<FilterValues>({
    tags: [],
    linkType: "all",
    hasQrCode: "all",
    campaignId: "all",
    folderId: "all",
  });

  const hasDateFilter = dateRange.start !== null || dateRange.end !== null;
  const hasActiveFilters =
    tagFilters.tags.length > 0 ||
    tagFilters.linkType !== "all" ||
    tagFilters.hasQrCode !== "all" ||
    tagFilters.campaignId !== "all" ||
    tagFilters.folderId !== "all";
  const activeFilterCount =
    (tagFilters.tags.length > 0 ? 1 : 0) +
    (tagFilters.linkType !== "all" ? 1 : 0) +
    (tagFilters.hasQrCode !== "all" ? 1 : 0) +
    (tagFilters.campaignId !== "all" ? 1 : 0) +
    (tagFilters.folderId !== "all" ? 1 : 0);

  const handleDateFilterApply = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };

  const handleFiltersApply = (filters: FilterValues) => {
    setTagFilters(filters);
  };

  const clearDateFilter = () => {
    setDateRange({ start: null, end: null });
  };

  const clearAllFilters = () => {
    setTagFilters({ tags: [], linkType: "all", hasQrCode: "all", campaignId: "all", folderId: "all" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t("linksTitle")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("linksDesc")}
            </p>
          </div>
          <PermissionGate resource="link" action="create">
            <Link href="/dashboard/links/new">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                <Plus className="mr-2 h-4 w-4" /> {t("createLink")}
              </Button>
            </Link>
          </PermissionGate>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap gap-3 items-center bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t("searchLinks")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 rounded-xl h-11 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <Button
            variant="outline"
            className={`bg-white border-slate-200 rounded-xl h-11 gap-2 hover:bg-slate-50 transition-all ${hasDateFilter ? "border-blue-500 bg-blue-50 hover:bg-blue-100/80" : ""}`}
            onClick={() => setDateFilterModalOpen(true)}
          >
            <Calendar
              className={`h-4 w-4 ${hasDateFilter ? "text-blue-600" : "text-slate-500"}`}
            />
            <span
              className={`text-sm font-medium ${hasDateFilter ? "text-blue-700" : "text-slate-700"}`}
            >
              {hasDateFilter
                ? `${dateRange.start ? format(dateRange.start, "MMM d") : ""} - ${dateRange.end ? format(dateRange.end, "MMM d") : ""}`
                : t("filterByDate")}
            </span>
            {hasDateFilter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateFilter();
                }}
                className="ml-1 p-1 hover:bg-blue-200/50 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-blue-600" />
              </button>
            )}
          </Button>

          <Button
            variant="outline"
            className={`bg-white border-slate-200 rounded-xl h-11 gap-2 hover:bg-slate-50 transition-all ${hasActiveFilters ? "border-blue-500 bg-blue-50 hover:bg-blue-100/80" : ""}`}
            onClick={() => setFiltersModalOpen(true)}
          >
            <SlidersHorizontal
              className={`h-4 w-4 ${hasActiveFilters ? "text-blue-600" : "text-slate-500"}`}
            />
            <span
              className={`text-sm font-medium ${hasActiveFilters ? "text-blue-700" : "text-slate-700"}`}
            >
              {hasActiveFilters
                ? t("filtersActive", { count: activeFilterCount })
                : t("addFilters")}
            </span>
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="ml-1 p-1 hover:bg-blue-200/50 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-blue-600" />
              </button>
            )}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-3 text-sm">
            {canBulkLinks() && totalLinksCount > 0 && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Checkbox
                  checked={selectedCount > 0 && selectedCount === totalLinksCount}
                  onCheckedChange={() => linksTableRef.current?.toggleSelectAll()}
                  className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  data-select-all
                />
                <label
                  className="text-slate-700 font-medium cursor-pointer select-none"
                  onClick={() => linksTableRef.current?.toggleSelectAll()}
                >
                  {t("selectAll")}
                </label>
              </div>
            )}
            {selectedCount > 0 && canBulkLinks() && (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
                {t("selected", { count: selectedCount })}
              </span>
            )}
            <PermissionGate resource="link" action="bulk">
              <ImportLinksModal onSuccess={() => linksTableRef.current?.refresh()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  {t("import")}
                </Button>
              </ImportLinksModal>
            </PermissionGate>
            <PermissionGate resource="link" action="export">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                onClick={() => linksTableRef.current?.handleExport()}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {t("export")}
              </Button>
            </PermissionGate>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === "list" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === "table" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[160px] bg-white border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 shadow-sm">
                <SelectValue placeholder={t("showAll")} />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-lg">
                <SelectItem value="all" className="rounded-lg cursor-pointer">
                  {t("showAll")}
                </SelectItem>
                <SelectItem
                  value="active"
                  className="rounded-lg cursor-pointer"
                >
                  {t("showActive")}
                </SelectItem>
                <SelectItem
                  value="disabled"
                  className="rounded-lg cursor-pointer"
                >
                  {t("showDisabled")}
                </SelectItem>
                <SelectItem
                  value="expired"
                  className="rounded-lg cursor-pointer"
                >
                  {t("showExpired")}
                </SelectItem>
                <SelectItem
                  value="archived"
                  className="rounded-lg cursor-pointer"
                >
                  {t("showArchived")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Links List */}
        <LinksTable
          ref={linksTableRef}
          searchQuery={searchQuery}
          viewMode={viewMode}
          statusFilter={statusFilter}
          dateRange={dateRange}
          tagFilters={tagFilters}
          onSelectionChange={setSelectedCount}
          onLinksCountChange={setTotalLinksCount}
        />

      {/* Filter Modals */}
      <DateFilterModal
        isOpen={dateFilterModalOpen}
        onClose={() => setDateFilterModalOpen(false)}
        onApply={handleDateFilterApply}
        initialStartDate={dateRange.start}
        initialEndDate={dateRange.end}
      />

      <FiltersModal
        isOpen={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        onApply={handleFiltersApply}
        initialFilters={tagFilters}
      />
    </div>
  );
}
