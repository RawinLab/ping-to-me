"use client";

import { LinksTable } from "@/components/links/LinksTable";
import { Button, Input } from "@pingtome/ui";
import Link from "next/link";
import { Plus, Search, Calendar, SlidersHorizontal, List, Table2, LayoutGrid } from "lucide-react";
import { useState } from "react";

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "table" | "grid">("list");

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

          <Button variant="outline" className="bg-white border-slate-200 rounded-lg h-10 gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700">Filter by created date</span>
          </Button>

          <Button variant="outline" className="bg-white border-slate-200 rounded-lg h-10 gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700">Add filters</span>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>0 selected</span>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" disabled>
              Export
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" disabled>
              Hide
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" disabled>
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
            <select className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Show: Active</option>
              <option value="all">Show: All</option>
              <option value="disabled">Show: Disabled</option>
              <option value="expired">Show: Expired</option>
            </select>
          </div>
        </div>

        {/* Links List */}
        <LinksTable searchQuery={searchQuery} viewMode={viewMode} />
      </div>
    </div>
  );
}
