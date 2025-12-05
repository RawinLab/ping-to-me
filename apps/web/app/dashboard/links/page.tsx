"use client";

import { LinksTable, LinksTableRef } from "@/components/links/LinksTable";
import { DateFilterModal } from "@/components/links/DateFilterModal";
import { FiltersModal, FilterValues } from "@/components/links/FiltersModal";
import { Button, Input } from "@pingtome/ui";
import Link from "next/link";
import { Plus, Search, Calendar, SlidersHorizontal, List, Table2, LayoutGrid, Download, X } from "lucide-react";
import { useState, useRef } from "react";
import { format } from "date-fns";

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "table" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCount, setSelectedCount] = useState(0);
  const linksTableRef = useRef<LinksTableRef>(null);

  // Filter modals state
  const [dateFilterModalOpen, setDateFilterModalOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);

  // Filter values
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [tagFilters, setTagFilters] = useState<FilterValues>({
    tags: [],
    linkType: "all",
    hasQrCode: "all",
  });

  const hasDateFilter = dateRange.start !== null || dateRange.end !== null;
  const hasActiveFilters = tagFilters.tags.length > 0 || tagFilters.linkType !== "all" || tagFilters.hasQrCode !== "all";
  const activeFilterCount = (tagFilters.tags.length > 0 ? 1 : 0) + (tagFilters.linkType !== "all" ? 1 : 0) + (tagFilters.hasQrCode !== "all" ? 1 : 0);

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
    setTagFilters({ tags: [], linkType: "all", hasQrCode: "all" });
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container py-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Links</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your shortened URLs</p>
          </div>
          <Link href="/dashboard/links/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
              <Plus className="mr-2 h-4 w-4" /> Create link
            </Button>
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search links"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 rounded-lg h-10"
            />
          </div>

          <Button
            variant="outline"
            className={`bg-white border-slate-200 rounded-lg h-10 gap-2 ${hasDateFilter ? "border-blue-500 bg-blue-50" : ""}`}
            onClick={() => setDateFilterModalOpen(true)}
          >
            <Calendar className={`h-4 w-4 ${hasDateFilter ? "text-blue-600" : "text-slate-500"}`} />
            <span className={hasDateFilter ? "text-blue-700" : "text-slate-700"}>
              {hasDateFilter
                ? `${dateRange.start ? format(dateRange.start, "MMM d") : ""} - ${dateRange.end ? format(dateRange.end, "MMM d") : ""}`
                : "Filter by created date"}
            </span>
            {hasDateFilter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateFilter();
                }}
                className="ml-1 p-0.5 hover:bg-blue-100 rounded"
              >
                <X className="h-3 w-3 text-blue-600" />
              </button>
            )}
          </Button>

          <Button
            variant="outline"
            className={`bg-white border-slate-200 rounded-lg h-10 gap-2 ${hasActiveFilters ? "border-blue-500 bg-blue-50" : ""}`}
            onClick={() => setFiltersModalOpen(true)}
          >
            <SlidersHorizontal className={`h-4 w-4 ${hasActiveFilters ? "text-blue-600" : "text-slate-500"}`} />
            <span className={hasActiveFilters ? "text-blue-700" : "text-slate-700"}>
              {hasActiveFilters ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active` : "Add filters"}
            </span>
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="ml-1 p-0.5 hover:bg-blue-100 rounded"
              >
                <X className="h-3 w-3 text-blue-600" />
              </button>
            )}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{selectedCount} selected</span>
            <Button
              variant="ghost"
              size="sm"
              className={selectedCount > 0 ? "text-slate-600 hover:text-slate-800" : "text-slate-400"}
              onClick={() => linksTableRef.current?.handleExport()}
            >
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={selectedCount > 0 ? "text-slate-600 hover:text-slate-800" : "text-slate-400"}
              disabled={selectedCount === 0}
              onClick={() => linksTableRef.current?.openBulkTagDialog()}
            >
              Tag
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-white p-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded ${viewMode === "list" ? "bg-slate-100" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded ${viewMode === "table" ? "bg-slate-100" : ""}`}
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded ${viewMode === "grid" ? "bg-slate-100" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <select
              className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Show: All</option>
              <option value="active">Show: Active</option>
              <option value="disabled">Show: Disabled</option>
              <option value="expired">Show: Expired</option>
              <option value="archived">Show: Archived</option>
            </select>
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
        />
      </div>

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
