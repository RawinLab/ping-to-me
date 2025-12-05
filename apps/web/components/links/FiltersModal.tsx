"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import { X, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export interface FilterValues {
  tags: string[];
  linkType: string;
  hasQrCode: string;
}

const LINK_TYPES = [
  { value: "all", label: "All" },
  { value: "standard", label: "Standard links" },
  { value: "bio", label: "Bio page links" },
];

const QR_CODE_OPTIONS = [
  { value: "all", label: "Links with or without attached QR Codes" },
  { value: "with", label: "Links with attached QR Codes" },
  { value: "without", label: "Links without attached QR Codes" },
];

export function FiltersModal({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: FiltersModalProps) {
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters?.tags || []);
  const [linkType, setLinkType] = useState(initialFilters?.linkType || "all");
  const [hasQrCode, setHasQrCode] = useState(initialFilters?.hasQrCode || "all");
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      const res = await apiRequest("/tags");
      setTags(res || []);
    } catch (error) {
      console.error("Failed to fetch tags");
    }
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    setLinkType("all");
    setHasQrCode("all");
  };

  const handleApply = () => {
    onApply({
      tags: selectedTags,
      linkType,
      hasQrCode,
    });
    onClose();
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Filters</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Tags filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tags</label>
            <div className="relative">
              <button
                onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-left hover:border-slate-300 transition-colors"
              >
                <span className="text-slate-600">
                  {selectedTags.length > 0
                    ? `${selectedTags.length} tag(s) selected`
                    : "Select tags"}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${tagsDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {tagsDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {tags.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">No tags available</div>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.name)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                      >
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center ${
                            selectedTags.includes(tag.name)
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {selectedTags.includes(tag.name) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">{tag.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Link type filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Link type</label>
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QR Code filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Attached QR Code</label>
            <Select value={hasQrCode} onValueChange={setHasQrCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_CODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-4 border-t bg-slate-50">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
            Clear all filters
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
