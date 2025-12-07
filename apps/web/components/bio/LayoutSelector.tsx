"use client";

import { Label, cn } from "@pingtome/ui";
import { LayoutList, LayoutGrid } from "lucide-react";

type Layout = "stacked" | "grid";

interface LayoutSelectorProps {
  value: Layout;
  onChange: (layout: Layout) => void;
}

export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
  const layouts: {
    value: Layout;
    label: string;
    icon: typeof LayoutList;
    preview: React.ReactNode;
  }[] = [
    {
      value: "stacked",
      label: "Stacked",
      icon: LayoutList,
      preview: (
        <div className="flex flex-col gap-2 w-full">
          <div className="h-2 bg-gray-300 rounded w-full" />
          <div className="h-2 bg-gray-300 rounded w-full" />
          <div className="h-2 bg-gray-300 rounded w-full" />
          <div className="h-2 bg-gray-300 rounded w-full" />
        </div>
      ),
    },
    {
      value: "grid",
      label: "Grid",
      icon: LayoutGrid,
      preview: (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="h-6 bg-gray-300 rounded" />
          <div className="h-6 bg-gray-300 rounded" />
          <div className="h-6 bg-gray-300 rounded" />
          <div className="h-6 bg-gray-300 rounded" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Link Layout</Label>
      <div className="grid grid-cols-2 gap-3">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isSelected = value === layout.value;

          return (
            <button
              key={layout.value}
              type="button"
              onClick={() => onChange(layout.value)}
              className={cn(
                "relative flex flex-col items-center gap-3 p-4 border-2 rounded-md transition-all hover:border-gray-400",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white"
              )}
            >
              {/* Icon */}
              <Icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isSelected ? "text-primary" : "text-gray-600"
                )}
              />

              {/* Visual Preview */}
              <div className="w-full px-2">{layout.preview}</div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-primary" : "text-gray-600"
                )}
              >
                {layout.label}
              </span>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
