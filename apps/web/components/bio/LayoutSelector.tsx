"use client";

import { Label, cn } from "@pingtome/ui";
import { LayoutList, LayoutGrid, LayoutDashboard, Check } from "lucide-react";

type Layout = "stacked" | "grid";

interface LayoutSelectorProps {
  value: Layout;
  onChange: (layout: Layout) => void;
}

export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
  const layouts: {
    value: Layout;
    label: string;
    subtitle: string;
    icon: typeof LayoutList;
    preview: React.ReactNode;
  }[] = [
    {
      value: "stacked",
      label: "Stacked",
      subtitle: "Traditional vertical list",
      icon: LayoutList,
      preview: (
        <div className="flex flex-col gap-2 w-full">
          <div className="h-8 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-lg shadow-sm transition-all" />
          <div className="h-8 bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600 rounded-lg shadow-sm transition-all" />
          <div className="h-8 bg-gradient-to-r from-pink-400 to-pink-500 dark:from-pink-500 dark:to-pink-600 rounded-lg shadow-sm transition-all" />
        </div>
      ),
    },
    {
      value: "grid",
      label: "Grid",
      subtitle: "Compact two-column layout",
      icon: LayoutGrid,
      preview: (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="h-10 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 rounded-lg shadow-sm transition-all" />
          <div className="h-10 bg-gradient-to-br from-orange-400 to-amber-500 dark:from-orange-500 dark:to-amber-600 rounded-lg shadow-sm transition-all" />
          <div className="h-10 bg-gradient-to-br from-violet-400 to-indigo-500 dark:from-violet-500 dark:to-indigo-600 rounded-lg shadow-sm transition-all" />
          <div className="h-10 bg-gradient-to-br from-rose-400 to-red-500 dark:from-rose-500 dark:to-red-600 rounded-lg shadow-sm transition-all" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold text-foreground">Choose Layout</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Select how your links will be displayed on your bio page
        </p>
      </div>

      {/* Layout Options */}
      <div className="grid grid-cols-2 gap-4">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isSelected = value === layout.value;

          return (
            <button
              key={layout.value}
              type="button"
              onClick={() => onChange(layout.value)}
              className={cn(
                "relative flex flex-col items-center gap-4 p-5 border-2 rounded-lg transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-md dark:hover:shadow-lg",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm ring-2 ring-primary/20"
                  : "border-border dark:border-border bg-card dark:bg-card hover:border-muted-foreground/30"
              )}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground transition-all">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />

              {/* Visual Preview */}
              <div className={cn(
                "w-full px-2 transition-transform duration-200",
                isSelected && "scale-[1.02]"
              )}>
                {layout.preview}
              </div>

              {/* Label and Subtitle */}
              <div className="text-center space-y-0.5">
                <div
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {layout.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {layout.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
